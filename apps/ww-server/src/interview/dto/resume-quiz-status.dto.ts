import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class ResumeQuizStatusDto {
  @ApiProperty({
    description: '简历押题请求ID（用于查询处理状态）',
    example: '236593c3-0e22-4682-a7b2-a73497750521',
  })
  @IsUUID('4')
  @IsNotEmpty()
  requestId: string
}
