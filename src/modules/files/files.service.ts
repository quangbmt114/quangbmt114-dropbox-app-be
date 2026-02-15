import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants';
import { deleteFile } from '../../common/utils/file.util';
import { FileResponseDto } from './dto/file-response.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Upload a file and store metadata
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<FileResponseDto> {
    this.logger.log('File upload initiated', {
      context: 'FilesService',
      userId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    try {
      // Store file metadata in database
      const uploadedFile = await this.prisma.file.create({
        data: {
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          path: file.path,
          userId,
        },
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          path: true,
          userId: true,
          createdAt: true,
        },
      });

      this.logger.log(SUCCESS_MESSAGES.FILE_UPLOADED, {
        context: 'FilesService',
        userId,
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
      });

      return uploadedFile;
    } catch (error) {
      this.logger.error(
        ERROR_MESSAGES.FILE_UPLOAD_FAILED,
        error.stack,
        {
          context: 'FilesService',
          userId,
          fileName: file.originalname,
        },
      );

      // Clean up uploaded file if database operation fails
      await deleteFile(file.path);

      throw new InternalServerErrorException(ERROR_MESSAGES.FILE_UPLOAD_FAILED);
    }
  }

  /**
   * Get all files for a user
   */
  async getUserFiles(userId: string): Promise<FileResponseDto[]> {
    this.logger.debug('Fetching user files', {
      context: 'FilesService',
      userId,
    });

    const files = await this.prisma.file.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        path: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.logger.debug(`Retrieved ${files.length} files`, {
      context: 'FilesService',
      userId,
      fileCount: files.length,
    });

    return files;
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
        userId: true,
      },
    });

    if (!file) {
      this.logger.warn('File deletion failed: File not found', {
        context: 'FilesService',
        userId,
        fileId,
      });
      throw new NotFoundException(ERROR_MESSAGES.FILE_NOT_FOUND);
    }

    // Check if user owns the file
    if (file.userId !== userId) {
      this.logger.warn('File deletion failed: Not file owner', {
        context: 'FilesService',
        userId,
        fileId,
        ownerId: file.userId,
      });
      throw new ForbiddenException(ERROR_MESSAGES.FILE_NOT_OWNER);
    }

    try {
      // Delete file from filesystem
      const deleted = await deleteFile(file.path);
      
      if (!deleted) {
        this.logger.warn('File not found on disk, continuing with database deletion', {
          context: 'FilesService',
          fileId,
          filePath: file.path,
        });
      }

      // Delete from database
      await this.prisma.file.delete({
        where: { id: fileId },
      });

      this.logger.log(SUCCESS_MESSAGES.FILE_DELETED, {
        context: 'FilesService',
        userId,
        fileId,
        fileName: file.name,
      });
    } catch (error) {
      this.logger.error(
        ERROR_MESSAGES.FILE_DELETE_FAILED,
        error.stack,
        {
          context: 'FilesService',
          userId,
          fileId,
        },
      );
      throw new InternalServerErrorException(ERROR_MESSAGES.FILE_DELETE_FAILED);
    }
  }
}


