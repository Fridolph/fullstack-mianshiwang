import { IsNotEmpty, IsString } from 'class-validator'

export class ContinueConversationDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string

  @IsString()
  @IsNotEmpty()
  question: string
}
