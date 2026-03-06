import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { FileResponseDto } from './dto/file-response.dto';
import { BaseResponseDto } from '../../common/dto';
import { FILE_UPLOAD } from '../../common/constants';
import { UploadRecommendationService } from './upload-recommendation.service';
import { UploadRecommendationQueryDto } from './dto/upload-recommendation.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly recommendationService: UploadRecommendationService,
  ) {}

  // ============ Upload Recommendation Endpoint ============

  @Get('upload/recommend')
  @ApiOperation({ summary: 'Get upload method recommendation based on file size' })
  @ApiQuery({
    name: 'fileSize',
    type: Number,
    description: 'File size in bytes',
    example: 1073741824,
  })
  @ApiQuery({
    name: 'mimeType',
    type: String,
    required: false,
    description: 'MIME type',
    example: 'video/mp4',
  })
  @ApiQuery({
    name: 'filename',
    type: String,
    required: false,
    description: 'Filename',
    example: 'large-video.mp4',
  })
  async getUploadRecommendation(
    @Query('fileSize') fileSize: string,
    @Query('mimeType') mimeType?: string,
    @Query('filename') filename?: string,
  ): Promise<BaseResponseDto<any>> {
    const query: UploadRecommendationQueryDto = {
      fileSize: parseInt(fileSize),
      mimeType,
      filename,
    };

    const recommendation = this.recommendationService.getRecommendation(query);
    
    return new BaseResponseDto(
      recommendation,
      'Upload recommendation generated',
    );
  }

  @Get('upload/limits')
  @ApiOperation({ summary: 'Get upload size limits' })
  @ApiQuery({
    name: 'mimeType',
    type: String,
    required: false,
    description: 'MIME type to check limits for',
    example: 'video/mp4',
  })
  async getUploadLimits(
    @Query('mimeType') mimeType?: string,
  ): Promise<BaseResponseDto<any>> {
    const limits = this.recommendationService.getUploadLimits(mimeType);
    return new BaseResponseDto(limits, 'Upload limits retrieved');
  }

  // ============ Regular Upload Endpoint ============

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (image, video, document, archive)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (images, videos, documents, archives)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: FILE_UPLOAD.UPLOAD_DIRECTORY,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize: FILE_UPLOAD.MAX_VIDEO_SIZE,
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<FileResponseDto>> {
    const uploadedFile = await this.filesService.uploadFile(file, user.id);
    return new BaseResponseDto(uploadedFile, 'File uploaded successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all user files with optional filtering' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['video', 'image', 'document', 'archive'],
    description: 'Filter by file type',
  })
  async getUserFiles(
    @CurrentUser() user: any,
    @Query('type') fileType?: string,
  ): Promise<BaseResponseDto<FileResponseDto[]>> {
    const files = await this.filesService.getUserFiles(user.id, fileType);
    return new BaseResponseDto(files, 'Files retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user storage statistics' })
  async getUserStorageStats(@CurrentUser() user: any): Promise<BaseResponseDto<any>> {
    const stats = await this.filesService.getUserStorageStats(user.id);
    return new BaseResponseDto(stats, 'Storage statistics retrieved successfully');
  }

  @Get('storage-info')
  @ApiOperation({ summary: 'Get storage configuration info' })
  async getStorageInfo(): Promise<BaseResponseDto<any>> {
    const info = await this.filesService.getStorageInfo();
    return new BaseResponseDto(info, 'Storage info retrieved successfully');
  }

  @Public()
  @Get('view/:id')
  @ApiOperation({ 
    summary: 'View/preview file (public, no auth required)',
    description: 'Stream file with inline content-disposition for browser preview. Images/videos display directly.'
  })
  async viewFile(
    @Param('id') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getFileByIdPublic(fileId);
    
    // For S3 files, redirect to S3 URL
    if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
      res.redirect(file.path);
      return;
    }
    
    // For local files, stream them
    const filePath = join(process.cwd(), file.path);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    
    // Set proper headers for file viewing
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', 'inline'); // Display in browser
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 year
    res.setHeader('Content-Length', file.size.toString());
    
    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  @Get('download/:id')
  @ApiOperation({ 
    summary: 'Download file (authenticated)',
    description: 'Force download with attachment content-disposition. Requires authentication.'
  })
  async downloadFile(
    @Param('id') fileId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getFileById(fileId, user.id);
    
    // For S3 files, redirect to S3 URL
    if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
      res.redirect(file.path);
      return;
    }
    
    // For local files, stream them
    const filePath = join(process.cwd(), file.path);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    
    // Set proper headers for file download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', file.size.toString());
    
    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  async getFileById(
    @Param('id') fileId: string,
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<FileResponseDto>> {
    const file = await this.filesService.getFileById(fileId, user.id);
    return new BaseResponseDto(file, 'File retrieved successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('id') fileId: string,
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<null>> {
    await this.filesService.deleteFile(fileId, user.id);
    return new BaseResponseDto(null, 'File deleted successfully');
  }

  @Post('delete-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple files' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fileIds'],
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file IDs to delete',
          example: ['uuid1', 'uuid2', 'uuid3'],
        },
      },
    },
  })
  async deleteMultipleFiles(
    @Body('fileIds') fileIds: string[],
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<{ deletedCount: number; failedFiles: any[] }>> {
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new BadRequestException('fileIds must be a non-empty array');
    }

    const result = await this.filesService.deleteMultipleFiles(fileIds, user.id);
    return new BaseResponseDto(result, 'Bulk deletion completed');
  }
}
