import { ApiProperty } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class ResumeQuizStageTwoDto {
  @ApiProperty({
    description: '第 1 阶段 7 道题对应的用户回答',
    type: [String],
    example: ['我会先介绍项目背景，再说明关键决策和量化结果'],
  })
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(5000, { each: true })
  answers: string[]

  @ApiProperty({
    description: '候选人补充说明，会作为第 2 阶段定制题的额外上下文',
    required: false,
    example: '我这次主要想重点补强性能优化和项目深挖这两个方向。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  supplementaryContext?: string
}
