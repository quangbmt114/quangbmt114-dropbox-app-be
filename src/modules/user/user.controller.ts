import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { BaseResponseDto } from '../../common/dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  @Get('me')
  getCurrentUser(@CurrentUser() user: any): BaseResponseDto<UserResponseDto> {
    const userData: UserResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
    return new BaseResponseDto(userData, 'User retrieved successfully');
  }
}


