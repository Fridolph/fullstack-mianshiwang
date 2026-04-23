import { ApiProperty } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class ResumeQuizResultAnalysisDto {
  @ApiProperty({
    description: '用户对每道题的回答，顺序需与题目顺序一致',
    type: [String],
    example: ['我会先介绍项目背景，再说明自己的关键决策...'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(5000, { each: true })
  answers: string[]
}
