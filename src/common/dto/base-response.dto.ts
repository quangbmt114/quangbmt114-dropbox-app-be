import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  constructor(data: T, message: string = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

