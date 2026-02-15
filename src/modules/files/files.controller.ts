import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileResponseDto } from './dto/file-response.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a file to the server. The file will be stored in the uploads directory and metadata saved to database. Only authenticated users can upload files.',
  })
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
          description: 'File to upload (any type)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - No file provided or invalid file',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadedFile = await this.filesService.uploadFile(file, user.id);

    return {
      message: 'File uploaded successfully',
      file: uploadedFile,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all files for current user',
    description: 'Retrieve a list of all files uploaded by the authenticated user. Files are ordered by creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user files retrieved successfully',
    type: [FileResponseDto],
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async getUserFiles(@CurrentUser() user: any): Promise<FileResponseDto[]> {
    return this.filesService.getUserFiles(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file by ID. Users can only delete their own files. The file will be removed from both filesystem and database.',
  })
  @ApiParam({
    name: 'id',
    description: 'File ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'File deleted successfully - No content returned',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - You can only delete your own files',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'File not found - The specified file does not exist',
    type: ErrorResponseDto,
  })
  async deleteFile(
    @Param('id') fileId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.filesService.deleteFile(fileId, user.id);
  }
}



