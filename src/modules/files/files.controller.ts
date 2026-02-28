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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileResponseDto } from './dto/file-response.dto';
import { BaseResponseDto } from '../../common/dto';
import { FILE_UPLOAD } from '../../common/constants';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
  @ApiQuery({ name: 'type', required: false, enum: ['video', 'image', 'document', 'archive'], description: 'Filter by file type' })
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



