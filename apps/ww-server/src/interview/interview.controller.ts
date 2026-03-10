import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ResponseUtil } from '../common/utils/response.util'
import { AnalyzeResumeDto } from './dto/analyze-resume.dto'
import { ContinueConversationDto } from './dto/continue-conversation.dto'
import { InterviewService } from './services/interview.service'

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('/analyze-resume')
  async analyzeResume(
    @Body() body: AnalyzeResumeDto,
    @Request() req: any,
  ) {
    const result = await this.interviewService.analyzeResume(
      req.user.userId,
      body.position,
      body.resume,
      body.jobDescription,
    )

    return ResponseUtil.success(result, '简历分析成功')
  }

  @Post('/continue-conversation')
  async continueConversation(
    @Body() body: ContinueConversationDto,
    @Request() req: any,
  ) {
    const result = await this.interviewService.continueConversation(
      req.user.userId,
      body.sessionId,
      body.question,
    )

    return ResponseUtil.success(
      {
        response: result,
      },
      '继续对话成功',
    )
  }
}
