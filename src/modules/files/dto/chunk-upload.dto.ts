import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadChunkDto {
  @ApiProperty({
    description: 'Unique file identifier for this upload session',
    example: 'abc-123-def-456',
  })
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'vacation-video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @ApiProperty({
    description: 'Index of this chunk (0-based)',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @ApiProperty({
    description: 'Total number of chunks',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  totalChunks: number;

  @ApiProperty({
    description: 'Total file size in bytes',
    example: 104857600,
  })
  @IsNumber()
  @Min(1)
  totalFileSize: number;
}

export class CompleteUploadDto {
  @ApiProperty({
    description: 'Unique file identifier',
    example: 'abc-123-def-456',
  })
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'vacation-video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @ApiProperty({
    description: 'Total file size in bytes',
    example: 104857600,
  })
  @IsNumber()
  @Min(1)
  totalFileSize: number;

  @ApiProperty({
    description: 'File MIME type',
    example: 'video/mp4',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

export class ChunkUploadStatusDto {
  @ApiProperty({
    description: 'File ID',
    example: 'abc-123-def-456',
  })
  fileId: string;

  @ApiProperty({
    description: 'Total chunks expected',
    example: 10,
  })
  totalChunks: number;

  @ApiProperty({
    description: 'Chunks received so far',
    example: 7,
  })
  chunksReceived: number;

  @ApiProperty({
    description: 'List of chunk indices received',
    example: [0, 1, 2, 3, 4, 5, 6],
  })
  receivedChunkIndices: number[];

  @ApiProperty({
    description: 'Upload progress percentage',
    example: 70,
  })
  progress: number;

  @ApiProperty({
    description: 'Whether upload is complete',
    example: false,
  })
  isComplete: boolean;
}
