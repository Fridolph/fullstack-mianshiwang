import { Controller, Post, UseGuards, Body, Request, Res } from '@nestjs/common'
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { InterviewService } from './services/interview.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { Response } from 'express'
import { ResumeQuizDto } from './dto/resume-quiz.dto'

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('/analyze-resume')
  async analyzeResume(
    @Body() body: { resume: string; jobDescription: string; position: string },
    @Request() req: any,
  ) {
    const result = await this.interviewService.analyzeResume(
      req?.user?.userId,
      body.position,
      body.resume,
      body.jobDescription,
    )
    return {
      code: 200,
      data: result,
    }
  }

  @Post('/continue-conversation')
  async continueConversation(
    @Body() body: { sessionId: string; question: string },
  ) {
    const result = await this.interviewService.continueConversation(
      body.sessionId,
      body.question,
    )

    return {
      code: 200,
      data: {
        response: result,
      },
    }
  }

  /**
   * 简历押题的接口
   */
  @Post('resume/quiz/stream')
  @UseGuards(JwtAuthGuard)
  resumeQuizStream(
    @Body() dto: ResumeQuizDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.userId
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // 禁用 Nginx 缓冲

    // 订阅进度事件
    const subscription = this.interviewService
      .generateResumeQuizWithProgress(userId, dto)
      .subscribe({
        next: (event) => {
          // 发送SSE事件
          res.write(`data: ${JSON.stringify(event)}\n\n`)
        },
        error: (error) => {
          // 发送错误事件
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`,
          )
        },
        complete: () => res.send(), // 完成后关闭连接
      })

    // 客户端断开连接时取消订阅
    req.on('close', () => {
      subscription.unsubscribe()
    })
  }

  // // 接口 2：开始模拟面试
  // @Post('mock/start')
  // @UseGuards(JwtAuthGuard)
  // async startMockInterview(@Body() dto, @Request() req) {}

  // // 接口 3：回答面试问题
  // @Post('mock/answer')
  // @UseGuards(JwtAuthGuard)
  // async answerMockInterview(@Body() dto, @Request() req) {}

  // // 接口 4：结束面试
  // @Post('mock/end')
  // @UseGuards(JwtAuthGuard)
  // async endMockInterview(@Body() data, @Request() req) {}
}
