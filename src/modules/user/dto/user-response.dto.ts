import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-02-16T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User name (optional)',
    example: 'John Doe',
    required: false,
  })
  name?: string;
}

