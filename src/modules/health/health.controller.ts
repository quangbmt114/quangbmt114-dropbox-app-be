import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckDto } from './dto/health-check.dto';
import { BaseResponseDto } from '../../common/dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  check(): BaseResponseDto<HealthCheckDto> {
    const data: HealthCheckDto = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    return new BaseResponseDto(data, 'Service is healthy');
  }
}


