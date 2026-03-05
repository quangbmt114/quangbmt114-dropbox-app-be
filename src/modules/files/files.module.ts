import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UploadRecommendationService } from './upload-recommendation.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [FilesService, UploadRecommendationService],
  exports: [FilesService],
})
export class FilesModule {}


