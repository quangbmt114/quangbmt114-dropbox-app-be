import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false, description: 'Always false for error responses' })
  success: boolean;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed', description: 'Human-readable error message' })
  message: string | string[];

  @ApiProperty({ example: 'AUTH_INVALID_CREDENTIALS', description: 'Error code for identification', required: false })
  code?: string;

  @ApiProperty({ example: {}, description: 'Additional error details (optional)', required: false })
  details?: Record<string, any>;
}


