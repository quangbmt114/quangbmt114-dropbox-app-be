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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileResponseDto } from './dto/file-response.dto';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
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
    const uploadedFile = await this.filesService.uploadFile(file, user.id);

    return {
      message: 'File uploaded successfully',
      file: uploadedFile,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all files for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of user files',
    type: [FileResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserFiles(@CurrentUser() user: any): Promise<FileResponseDto[]> {
    return this.filesService.getUserFiles(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({
    status: 204,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete your own files',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async deleteFile(
    @Param('id') fileId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.filesService.deleteFile(fileId, user.id);
  }
}


