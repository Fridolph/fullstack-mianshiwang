import { ApiProperty } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class ResumeQuizFinalEvaluationDto {
  @ApiProperty({
    description: '全部 10 道题的用户回答，顺序需与题目顺序一致',
    type: [String],
    example: ['这是第 1 题回答', '这是第 2 题回答'],
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(5000, { each: true })
  answers: string[]
}
