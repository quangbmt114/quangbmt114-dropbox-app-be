import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UploadRecommendationService } from './upload-recommendation.service';
import { ThumbnailService } from './thumbnail.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, UploadRecommendationService, ThumbnailService],
  exports: [FilesService],
})
export class FilesModule {}


