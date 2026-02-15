import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ 
    description: 'Health status',
    example: 'ok'
  })
  status: string;

  @ApiProperty({ 
    description: 'Current timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  timestamp: string;

  @ApiProperty({ 
    description: 'Application uptime in seconds',
    example: 123.456
  })
  uptime: number;
}

