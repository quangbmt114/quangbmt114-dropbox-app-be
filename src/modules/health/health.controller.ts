import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckDto } from './dto/health-check.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Check if the API is running and healthy. Returns service status, timestamp, and uptime.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and running',
    type: HealthCheckDto,
  })
  check(): HealthCheckDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}


