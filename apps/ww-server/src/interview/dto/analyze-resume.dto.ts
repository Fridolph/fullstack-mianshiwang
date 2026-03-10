import { IsNotEmpty, IsString } from 'class-validator'

export class AnalyzeResumeDto {
  @IsString()
  @IsNotEmpty()
  resume: string

  @IsString()
  @IsNotEmpty()
  jobDescription: string

  @IsString()
  @IsNotEmpty()
  position: string
}
