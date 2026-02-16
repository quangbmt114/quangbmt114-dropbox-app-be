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
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileResponseDto } from './dto/file-response.dto';
import { BaseResponseDto } from '../../common/dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
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
  ): Promise<BaseResponseDto<FileResponseDto>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadedFile = await this.filesService.uploadFile(file, user.id);
    return new BaseResponseDto(uploadedFile, 'File uploaded successfully');
  }

  @Get()
  async getUserFiles(@CurrentUser() user: any): Promise<BaseResponseDto<FileResponseDto[]>> {
    const files = await this.filesService.getUserFiles(user.id);
    return new BaseResponseDto(files, 'Files retrieved successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteFile(
    @Param('id') fileId: string,
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<null>> {
    await this.filesService.deleteFile(fileId, user.id);
    return new BaseResponseDto(null, 'File deleted successfully');
  }
}



