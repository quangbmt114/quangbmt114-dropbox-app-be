import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({
    description: 'File ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'File name',
    example: 'document.pdf',
  })
  name: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024,
  })
  size: number;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File storage path',
    example: 'uploads/2024-02-16/file-123.pdf',
  })
  path: string;

  @ApiProperty({
    description: 'User ID who uploaded the file',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'File upload date',
    example: '2024-02-16T00:00:00.000Z',
  })
  createdAt: Date;
}


