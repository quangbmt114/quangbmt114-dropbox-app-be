import { IsInt, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadRecommendationQueryDto {
  @ApiProperty({
    description: 'File size in bytes',
    example: 1073741824,
  })
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'video/mp4',
    required: false,
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiProperty({
    description: 'Filename',
    example: 'large-video.mp4',
    required: false,
  })
  @IsString()
  @IsOptional()
  filename?: string;
}

export class UploadRecommendationDto {
  // Recommendation
  recommendedMethod: 'regular' | 'chunked';
  reason: string;
  
  // File info
  fileSize: number;
  fileSizeFormatted: string;
  mimeType?: string;
  fileType?: string;
  
  // Upload config
  shouldUseChunked: boolean;
  estimatedTime: {
    regular?: string;
    chunked?: string;
  };
  
  // Chunked config (if recommended)
  chunkedConfig?: {
    recommendedChunkSize: number;
    recommendedChunkSizeFormatted: string;
    totalChunks: number;
    estimatedTimePerChunk: string;
    canResume: boolean;
    canUploadParallel: boolean;
    maxParallelUploads: number;
  };
  
  // Warnings
  warnings: string[];
  tips: string[];
  
  // Storage info
  storageType: 'local' | 's3';
  supportsDirectUpload: boolean;
}
