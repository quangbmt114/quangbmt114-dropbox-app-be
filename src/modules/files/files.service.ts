import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { join } from 'path';
import { promises as fs } from 'fs';
import { createWriteStream, createReadStream } from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { StorageService } from '../../common/storage/storage.service';
import { ThumbnailService } from './thumbnail.service';
import { SUCCESS_MESSAGES, FILE_UPLOAD, FILE_SELECT_FIELDS } from '../../common/constants';
import { BusinessException } from '../../common/exceptions';
import {
  formatFileSize,
  getFileExtension,
  getFileTypeCategory,
  bytesToMB,
  bytesToGB,
  getMaxFileSize,
} from '../../common/utils/file.util';
import { FileResponseDto } from './dto/file-response.dto';
import { ChunkUploadStatusDto } from './dto/chunk-upload.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly thumbnailService: ThumbnailService,
  ) {}

  /**
   * Upload a file and store metadata
   */
  async uploadFile(file: Express.Multer.File, userId: string): Promise<FileResponseDto> {
    if (!file) throw new BadRequestException('No file provided');

    const fileType = getFileTypeCategory(file.mimetype);
    const fileExtension = getFileExtension(file.originalname);
    const storageType = this.storageService.getStorageType();

    this.logger.log('File upload initiated', {
      context: 'FilesService',
      userId,
      fileName: file.originalname,
      fileSize: formatFileSize(file.size),
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
      fileType,
      extension: fileExtension,
      storageType,
    });

    try {
      // Validate file
      this.validateFile(file);

      // Check user storage quota
      await this.checkUserStorageQuota(userId, file.size);

      // Generate storage key
      const storageKey = this.generateStorageKey(userId, file.originalname);

      // Upload to storage (S3 or Local based on configuration)
      const uploadResult = await this.storageService.uploadFile(file, storageKey);

      let thumbnailPath: string | null = null;
      let duration: number | null = null;

      // Generate thumbnail for videos (only for local storage)
      if (fileType === 'video' && storageType === 'local') {
        try {
          const videoPath = join(process.cwd(), uploadResult.url);
          const thumbnailDir = path.dirname(videoPath);
          const baseFilename = path.basename(storageKey, path.extname(storageKey));

          // Get video metadata
          const metadata = await this.thumbnailService.getVideoMetadata(videoPath);
          duration = Math.round(metadata.duration);

          // Generate thumbnail
          const thumbnailFullPath = await this.thumbnailService.generateVideoThumbnail(
            videoPath,
            thumbnailDir,
            baseFilename,
          );

          // Convert to relative path for storage
          thumbnailPath = thumbnailFullPath.replace(process.cwd() + '/', '').replace(/\\/g, '/');

          this.logger.log('Video thumbnail generated', {
            context: 'FilesService',
            videoPath: uploadResult.url,
            thumbnailPath,
            duration,
          });
        } catch (error) {
          this.logger.warn('Failed to generate video thumbnail', {
            context: 'FilesService',
            error: error.message,
            fileId: storageKey,
          });
          // Don't fail upload if thumbnail generation fails
        }
      }

      // Store file metadata in database
      const uploadedFile = await this.prisma.file.create({
        data: {
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          path: uploadResult.url, // Store the URL/path returned by storage
          thumbnailPath,
          duration,
          userId,
        },
        select: FILE_SELECT_FIELDS,
      });

      this.logger.log(SUCCESS_MESSAGES.FILE_UPLOADED, {
        context: 'FilesService',
        userId,
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
        fileType,
        fileSize: formatFileSize(uploadedFile.size),
        storageType: uploadResult.storageType,
        storageKey,
        hasThumbnail: !!thumbnailPath,
      });

      // Add URLs for response
      return this.addFileUrls(uploadedFile);
    } catch (error) {
      this.logger.error('File upload failed', error.stack, {
        context: 'FilesService',
        userId,
        fileName: file.originalname,
        fileType,
        errorCode: 'FILE_UPLOAD_FAILED',
      });

      // Storage service handles cleanup
      // Re-throw if it's already a BusinessException
      if (error instanceof BusinessException || error instanceof BadRequestException) {
        throw error;
      }

      throw BusinessException.fileUploadFailed(error.message);
    }
  }

  /**
   * Generate a unique storage key for the file
   */
  private generateStorageKey(userId: string, originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = getFileExtension(originalFilename);
    
    // Get filename without extension and sanitize
    const filenameWithoutExt = path.basename(originalFilename, ext);
    const sanitizedFilename = filenameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);

    // Format: users/{userId}/{year}/{month}/{timestamp}-{random}-{filename}{ext}
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `users/${userId}/${year}/${month}/${timestamp}-${random}-${sanitizedFilename}${ext}`;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    // Validate MIME type
    if (!FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      this.logger.warn('File type not allowed', {
        context: 'FilesService',
        fileName: file.originalname,
        mimeType: file.mimetype,
        errorCode: 'FILE_TYPE_NOT_ALLOWED',
      });
      throw BusinessException.fileTypeNotAllowed(file.mimetype);
    }

    // Validate file size based on type
    const maxSize = getMaxFileSize(file.mimetype);

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const actualSizeMB = bytesToMB(file.size);
      const fileType = getFileTypeCategory(file.mimetype);

      this.logger.warn('File size exceeds limit', {
        context: 'FilesService',
        fileName: file.originalname,
        fileSize: file.size,
        maxSize,
        fileType,
        errorCode: 'FILE_TOO_LARGE',
      });

      throw BusinessException.fileTooLarge(
        `File size (${actualSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB for ${fileType === 'video' ? 'videos' : 'images/documents'}`,
      );
    }

    // Validate file name length
    if (file.originalname.length > FILE_UPLOAD.MAX_FILENAME_LENGTH) {
      throw BusinessException.fileUploadFailed(
        `File name is too long (max ${FILE_UPLOAD.MAX_FILENAME_LENGTH} characters)`,
      );
    }
  }

  /**
   * Check user storage quota
   */
  private async checkUserStorageQuota(userId: string, newFileSize: number): Promise<void> {
    try {
      // Get total size of user's files
      const result = await this.prisma.file.aggregate({
        where: { userId },
        _sum: {
          size: true,
        },
      });

      const currentTotalSize = result._sum.size || 0;
      const maxStorageSize = FILE_UPLOAD.MAX_STORAGE_QUOTA;

      if (currentTotalSize + newFileSize > maxStorageSize) {
        const currentSizeGB = bytesToGB(currentTotalSize);
        const maxSizeGB = bytesToGB(maxStorageSize);

        this.logger.warn('Storage quota exceeded', {
          context: 'FilesService',
          userId,
          currentTotalSize,
          newFileSize,
          maxStorageSize,
          errorCode: 'STORAGE_QUOTA_EXCEEDED',
        });

        throw BusinessException.fileUploadFailed(
          `Storage quota exceeded. Current usage: ${currentSizeGB}GB / ${maxSizeGB}GB`,
        );
      }

      this.logger.debug('Storage quota check passed', {
        context: 'FilesService',
        userId,
        currentSize: formatFileSize(currentTotalSize),
        newFileSize: formatFileSize(newFileSize),
        totalAfterUpload: formatFileSize(currentTotalSize + newFileSize),
      });
    } catch (error) {
      // If it's already a BusinessException, re-throw it
      if (error instanceof BusinessException) {
        throw error;
      }

      // Log but don't fail the upload if quota check fails
      this.logger.error('Storage quota check failed', error.stack, {
        context: 'FilesService',
        userId,
      });
    }
  }

  /**
   * Get all files for a user with optional filtering
   */
  async getUserFiles(userId: string, fileType?: string): Promise<FileResponseDto[]> {
    this.logger.debug('Fetching user files', {
      context: 'FilesService',
      userId,
      fileType,
    });

    // Build where clause
    const where: any = { userId };

    // Filter by file type if provided
    if (fileType) {
      switch (fileType.toLowerCase()) {
        case 'video':
          where.mimeType = { startsWith: 'video/' };
          break;
        case 'image':
          where.mimeType = { startsWith: 'image/' };
          break;
        case 'document':
          where.mimeType = {
            in: FILE_UPLOAD.DOCUMENT_MIME_TYPES,
          };
          break;
        case 'archive':
          where.mimeType = 'application/zip';
          break;
      }
    }

    const files = await this.prisma.file.findMany({
      where,
      select: FILE_SELECT_FIELDS,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add URLs to each file
    const filesWithUrls = files.map((file) => this.addFileUrls(file));

    // Calculate statistics
    const totalSize = filesWithUrls.reduce((sum, file) => sum + file.size, 0);
    const fileTypeBreakdown = filesWithUrls.reduce(
      (acc, file) => {
        const type = getFileTypeCategory(file.mimeType);
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    this.logger.debug(`Retrieved ${filesWithUrls.length} files`, {
      context: 'FilesService',
      userId,
      fileCount: filesWithUrls.length,
      totalSize: formatFileSize(totalSize),
      fileTypeBreakdown,
    });

    return filesWithUrls;
  }

  /**
   * Get user storage statistics
   */
  async getUserStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    filesByType: Record<string, { count: number; size: number; sizeFormatted: string }>;
  }> {
    this.logger.debug('Fetching user storage statistics', {
      context: 'FilesService',
      userId,
    });

    const files = await this.prisma.file.findMany({
      where: { userId },
      select: {
        size: true,
        mimeType: true,
      },
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Group by file type
    const filesByType = files.reduce(
      (acc, file) => {
        const type = getFileTypeCategory(file.mimeType);
        if (!acc[type]) {
          acc[type] = { count: 0, size: 0, sizeFormatted: '' };
        }
        acc[type].count += 1;
        acc[type].size += file.size;
        acc[type].sizeFormatted = formatFileSize(acc[type].size);
        return acc;
      },
      {} as Record<string, { count: number; size: number; sizeFormatted: string }>,
    );

    const stats = {
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      filesByType,
    };

    this.logger.debug('Storage statistics calculated', {
      context: 'FilesService',
      userId,
      stats,
    });

    return stats;
  }

  /**
   * Get file by ID with ownership check
   */
  async getFileById(fileId: string, userId: string): Promise<FileResponseDto> {
    this.logger.debug('Fetching file by ID', {
      context: 'FilesService',
      userId,
      fileId,
    });

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: FILE_SELECT_FIELDS,
    });

    if (!file) {
      this.logger.warn('File not found', {
        context: 'FilesService',
        userId,
        fileId,
        errorCode: 'FILE_NOT_FOUND',
      });
      throw BusinessException.fileNotFound(fileId);
    }

    // Check ownership
    if (file.userId !== userId) {
      this.logger.warn('File access denied: Not file owner', {
        context: 'FilesService',
        userId,
        fileId,
        ownerId: file.userId,
        errorCode: 'FILE_NOT_OWNER',
      });
      throw BusinessException.fileNotOwner(fileId, userId);
    }

    return this.addFileUrls(file);
  }

  /**
   * Get file by ID for public access (no ownership check)
   */
  async getFileByIdPublic(fileId: string): Promise<FileResponseDto> {
    this.logger.debug('Fetching file by ID (public)', {
      context: 'FilesService',
      fileId,
    });

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: FILE_SELECT_FIELDS,
    });

    if (!file) {
      this.logger.warn('File not found (public access)', {
        context: 'FilesService',
        fileId,
        errorCode: 'FILE_NOT_FOUND',
      });
      throw BusinessException.fileNotFound(fileId);
    }

    return this.addFileUrls(file);
  }

  /**
   * Delete a file (with ownership check)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    this.logger.log('File deletion initiated', {
      context: 'FilesService',
      userId,
      fileId,
    });

    // Find file and check ownership
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        path: true,
        name: true,
        size: true,
        mimeType: true,
        userId: true,
      },
    });

    if (!file) {
      this.logger.warn('File deletion failed: File not found', {
        context: 'FilesService',
        userId,
        fileId,
        errorCode: 'FILE_NOT_FOUND',
      });
      throw BusinessException.fileNotFound(fileId);
    }

    // Check if user owns the file
    if (file.userId !== userId) {
      this.logger.warn('File deletion failed: Not file owner', {
        context: 'FilesService',
        userId,
        fileId,
        ownerId: file.userId,
        errorCode: 'FILE_NOT_OWNER',
      });
      throw BusinessException.fileNotOwner(fileId, userId);
    }

    try {
      // Extract storage key from path
      const storageKey = this.extractStorageKey(file.path);

      // Delete file from storage (S3 or Local)
      const deleted = await this.storageService.deleteFile(storageKey);

      if (!deleted) {
        this.logger.warn('File not found in storage, continuing with database deletion', {
          context: 'FilesService',
          fileId,
          filePath: file.path,
          storageKey,
        });
      }

      // Delete from database (soft delete)
      await this.prisma.file.update({
        where: { id: fileId },
        data: { deletedAt: new Date() },
      });

      this.logger.log(SUCCESS_MESSAGES.FILE_DELETED, {
        context: 'FilesService',
        userId,
        fileId,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: getFileTypeCategory(file.mimeType),
      });
    } catch (error) {
      this.logger.error('File deletion failed', error.stack, {
        context: 'FilesService',
        userId,
        fileId,
        fileName: file.name,
        errorCode: 'FILE_DELETE_FAILED',
      });
      throw BusinessException.fileDeleteFailed(error.message);
    }
  }

  /**
   * Extract storage key from file path/URL
   */
  private extractStorageKey(path: string): string {
    // If it's an S3 URL, extract the key
    if (path.includes('s3.amazonaws.com') || path.includes('cloudfront.net')) {
      const url = new URL(path);
      return url.pathname.substring(1); // Remove leading slash
    }

    // For local storage, return the path
    return path;
  }

  /**
   * Get storage configuration info
   */
  getStorageInfo(): {
    storageType: 'local' | 's3';
    isS3Available: boolean;
    supportsPresignedUrls: boolean;
  } {
    return {
      storageType: this.storageService.getStorageType(),
      isS3Available: this.storageService.isS3Available(),
      supportsPresignedUrls: this.storageService.isS3Available(),
    };
  }

  /**
   * Delete multiple files at once
   */
  async deleteMultipleFiles(
    fileIds: string[],
    userId: string,
  ): Promise<{
    deletedCount: number;
    failedFiles: { fileId: string; reason: string }[];
  }> {
    this.logger.log('Bulk file deletion initiated', {
      context: 'FilesService',
      userId,
      fileCount: fileIds.length,
    });

    const failedFiles: { fileId: string; reason: string }[] = [];
    let deletedCount = 0;

    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId, userId);
        deletedCount++;
      } catch (error) {
        failedFiles.push({
          fileId,
          reason: error.message || 'Unknown error',
        });
        this.logger.warn('Failed to delete file in bulk operation', {
          context: 'FilesService',
          userId,
          fileId,
          error: error.message,
        });
      }
    }

    this.logger.log('Bulk file deletion completed', {
      context: 'FilesService',
      userId,
      totalRequested: fileIds.length,
      deletedCount,
      failedCount: failedFiles.length,
    });

    return { deletedCount, failedFiles };
  }

  /**
   * Add file URLs (view URL and thumbnail URL) to file object
   */
  private addFileUrls(file: any): FileResponseDto {
    const baseUrl = this.configService.get<string>('BASE_URL') || 
      `http://localhost:${this.configService.get<number>('PORT', 7001)}`;
    
    let url: string;
    
    // S3 files: use S3 URL directly
    if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
      url = file.path;
    } else {
      // Local files: use direct static path for better performance
      // Format: http://localhost:7001/uploads/users/.../file.png
      url = `${baseUrl}/${file.path}`;
    }
    
    // Generate thumbnail URL for images and videos
    let thumbnailUrl: string | undefined;
    const fileType = getFileTypeCategory(file.mimeType);
    
    if (fileType === 'image' || fileType === 'video') {
      if (file.thumbnailPath) {
        // If thumbnail exists, use it
        thumbnailUrl = file.thumbnailPath.startsWith('http://') || file.thumbnailPath.startsWith('https://')
          ? file.thumbnailPath
          : `${baseUrl}/${file.thumbnailPath}`;
      } else {
        // For images, use the image itself as thumbnail
        // For videos without thumbnail, use a placeholder or the video URL
        if (fileType === 'image') {
          thumbnailUrl = url;
        } else {
          // Video without thumbnail - FE can show video icon or first frame
          thumbnailUrl = undefined;
        }
      }
    }
    
    return {
      ...file,
      url,
      thumbnailUrl,
    };
  }

  /**
   * ========================================
   * CHUNKED UPLOAD METHODS
   * ========================================
   */

  /**
   * Save uploaded chunk to temporary storage
   */
  async saveChunk(
    fileId: string,
    chunkIndex: number,
    totalChunks: number,
    chunk: Express.Multer.File,
    userId: string,
  ): Promise<void> {
    const chunkDir = join(process.cwd(), 'uploads', 'temp', userId, fileId);
    
    try {
      // Ensure chunk directory exists
      await fs.mkdir(chunkDir, { recursive: true });

      // Save chunk with padded index for proper sorting
      const paddedIndex = chunkIndex.toString().padStart(5, '0');
      const chunkPath = join(chunkDir, `chunk-${paddedIndex}`);
      
      await fs.writeFile(chunkPath, chunk.buffer);

      this.logger.log('Chunk saved', {
        context: 'FilesService',
        userId,
        fileId,
        chunkIndex,
        totalChunks,
        chunkSize: formatFileSize(chunk.size),
        progress: `${chunkIndex + 1}/${totalChunks}`,
      });
    } catch (error) {
      this.logger.error('Failed to save chunk', error.stack, {
        context: 'FilesService',
        userId,
        fileId,
        chunkIndex,
        error: error.message,
      });
      throw new BadRequestException(`Failed to save chunk ${chunkIndex}`);
    }
  }

  /**
   * Get upload status for a chunked upload
   */
  async getChunkUploadStatus(fileId: string, userId: string): Promise<ChunkUploadStatusDto> {
    const chunkDir = join(process.cwd(), 'uploads', 'temp', userId, fileId);

    try {
      // Check if directory exists
      await fs.access(chunkDir);
      
      // List all chunks
      const files = await fs.readdir(chunkDir);
      const chunkFiles = files.filter(f => f.startsWith('chunk-'));
      
      // Extract chunk indices
      const receivedChunkIndices = chunkFiles
        .map(f => parseInt(f.replace('chunk-', '')))
        .sort((a, b) => a - b);

      // Read metadata if exists
      const metadataPath = join(chunkDir, 'metadata.json');
      let totalChunks = receivedChunkIndices.length;
      
      try {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        totalChunks = metadata.totalChunks || totalChunks;
      } catch {
        // Metadata not found, use current chunk count
      }

      const chunksReceived = receivedChunkIndices.length;
      const progress = totalChunks > 0 ? Math.round((chunksReceived / totalChunks) * 100) : 0;
      const isComplete = chunksReceived === totalChunks && totalChunks > 0;

      return {
        fileId,
        totalChunks,
        chunksReceived,
        receivedChunkIndices,
        progress,
        isComplete,
      };
    } catch (error) {
      // Directory doesn't exist - no chunks uploaded yet
      return {
        fileId,
        totalChunks: 0,
        chunksReceived: 0,
        receivedChunkIndices: [],
        progress: 0,
        isComplete: false,
      };
    }
  }

  /**
   * Assemble chunks into final file and save to database
   */
  async assembleChunks(
    fileId: string,
    originalFilename: string,
    totalFileSize: number,
    mimeType: string,
    userId: string,
  ): Promise<FileResponseDto> {
    const chunkDir = join(process.cwd(), 'uploads', 'temp', userId, fileId);

    this.logger.log('Starting chunk assembly', {
      context: 'FilesService',
      userId,
      fileId,
      originalFilename,
      totalFileSize: formatFileSize(totalFileSize),
    });

    try {
      // List and sort chunk files
      const files = await fs.readdir(chunkDir);
      const chunkFiles = files
        .filter(f => f.startsWith('chunk-'))
        .sort((a, b) => {
          const aIndex = parseInt(a.replace('chunk-', ''));
          const bIndex = parseInt(b.replace('chunk-', ''));
          return aIndex - bIndex;
        });

      if (chunkFiles.length === 0) {
        throw new BadRequestException('No chunks found');
      }

      // Generate final file path
      const storageKey = this.generateStorageKey(userId, originalFilename);
      const finalPath = join(process.cwd(), storageKey);
      const finalDir = path.dirname(finalPath);

      // Ensure final directory exists
      await fs.mkdir(finalDir, { recursive: true });

      // Assemble chunks
      const writeStream = createWriteStream(finalPath);
      let assembledSize = 0;

      for (const chunkFile of chunkFiles) {
        const chunkPath = join(chunkDir, chunkFile);
        const chunkData = await fs.readFile(chunkPath);
        
        writeStream.write(chunkData);
        assembledSize += chunkData.length;

        this.logger.debug('Chunk assembled', {
          context: 'FilesService',
          chunkFile,
          chunkSize: formatFileSize(chunkData.length),
          assembledSize: formatFileSize(assembledSize),
        });
      }

      // Close write stream
      await new Promise<void>((resolve, reject) => {
        writeStream.end((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.logger.log('Chunks assembled successfully', {
        context: 'FilesService',
        userId,
        fileId,
        totalChunks: chunkFiles.length,
        assembledSize: formatFileSize(assembledSize),
        finalPath: storageKey,
      });

      // Clean up temp chunks
      await fs.rm(chunkDir, { recursive: true, force: true });

      this.logger.log('Temp chunks cleaned up', {
        context: 'FilesService',
        userId,
        fileId,
      });

      // Generate thumbnails for videos if needed
      let thumbnailPath: string | null = null;
      let duration: number | null = null;
      const fileType = getFileTypeCategory(mimeType);

      if (fileType === 'video') {
        try {
          const videoPath = join(process.cwd(), storageKey);
          const thumbnailDir = path.dirname(videoPath);
          const baseFilename = path.basename(storageKey, path.extname(storageKey));

          // Get video metadata
          const metadata = await this.thumbnailService.getVideoMetadata(videoPath);
          duration = Math.round(metadata.duration);

          // Generate thumbnail
          const thumbnailFullPath = await this.thumbnailService.generateVideoThumbnail(
            videoPath,
            thumbnailDir,
            baseFilename,
          );

          thumbnailPath = thumbnailFullPath.replace(process.cwd() + '/', '').replace(/\\/g, '/');

          this.logger.log('Video thumbnail generated after chunk assembly', {
            context: 'FilesService',
            videoPath: storageKey,
            thumbnailPath,
            duration,
          });
        } catch (error) {
          this.logger.warn('Failed to generate video thumbnail', {
            context: 'FilesService',
            error: error.message,
            fileId,
          });
        }
      }

      // Save to database
      const uploadedFile = await this.prisma.file.create({
        data: {
          name: originalFilename,
          size: assembledSize,
          mimeType,
          path: storageKey,
          thumbnailPath,
          duration,
          userId,
        },
        select: FILE_SELECT_FIELDS,
      });

      this.logger.log('File metadata saved to database', {
        context: 'FilesService',
        userId,
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
        fileSize: formatFileSize(uploadedFile.size),
      });

      return this.addFileUrls(uploadedFile);
    } catch (error) {
      this.logger.error('Failed to assemble chunks', error.stack, {
        context: 'FilesService',
        userId,
        fileId,
        originalFilename,
        error: error.message,
      });

      // Clean up on error
      try {
        await fs.rm(chunkDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }

      throw BusinessException.fileUploadFailed(error.message);
    }
  }

  /**
   * Cancel chunked upload and clean up temp files
   */
  async cancelChunkedUpload(fileId: string, userId: string): Promise<void> {
    const chunkDir = join(process.cwd(), 'uploads', 'temp', userId, fileId);

    try {
      await fs.rm(chunkDir, { recursive: true, force: true });
      
      this.logger.log('Chunked upload cancelled and cleaned up', {
        context: 'FilesService',
        userId,
        fileId,
      });
    } catch (error) {
      this.logger.warn('Failed to clean up cancelled upload', {
        context: 'FilesService',
        userId,
        fileId,
        error: error.message,
      });
    }
  }
}
