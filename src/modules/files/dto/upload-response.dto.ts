import { ApiProperty } from '@nestjs/swagger';
import { FileResponseDto } from './file-response.dto';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'File uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Uploaded file information',
  })
  file: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    path: string;
    createdAt: Date;
  };
}

