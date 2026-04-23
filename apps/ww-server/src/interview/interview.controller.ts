import {
  Controller,
  Post,
  UseGuards,
  Body,
  Request,
  Res,
  Get,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { InterviewService } from './services/interview.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { Response } from 'express'
import { ResumeQuizDto } from './dto/resume-quiz.dto'
import { ResumeQuizFinalEvaluationDto } from './dto/resume-quiz-final-evaluation.dto'
import { ResumeQuizResultAnalysisDto } from './dto/resume-quiz-result-analysis.dto'
import { ResumeQuizStageTwoDto } from './dto/resume-quiz-stage-two.dto'
import { ResumeQuizStatusDto } from './dto/resume-quiz-status.dto'
import { Logger } from '@nestjs/common'
import { ResponseUtil } from '../common/utils/response.util'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('interview')
export class InterviewController {
  private readonly logger = new Logger(InterviewController.name)

  constructor(private readonly interviewService: InterviewService) {}

  /**
   * 简历分析接口
   * @param body
   * @param req
   */
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
    return ResponseUtil.success(result, '简历分析成功')
  }

  /**
   * 继续对话 - 实现对话历史，能够多轮对话
   */
  @Post('/continue-conversation')
  async continueConversation(
    @Body() body: { sessionId: string; question: string },
  ) {
    const result = await this.interviewService.continueConversation(
      body.sessionId,
      body.question,
    )

    return ResponseUtil.success(
      {
        response: result,
      },
      '继续追问成功',
    )
  }

  @Get('records/:recordId')
  @UseGuards(JwtAuthGuard)
  async getConsumptionRecordDetail(
    @Param('recordId') recordId: string,
    @Request() req: any,
  ) {
    const result = await this.interviewService.getConsumptionRecordDetail(
      req.user.userId,
      recordId,
    )

    return ResponseUtil.success(result, '获取历史记录详情成功')
  }

  @Get('records/:recordId/result-analysis')
  @UseGuards(JwtAuthGuard)
  async getResumeQuizResultAnalysis(
    @Param('recordId') recordId: string,
    @Request() req: any,
  ) {
    const result = await this.interviewService.getResumeQuizResultAnalysis(
      req.user.userId,
      recordId,
    )

    return ResponseUtil.success(result, '获取答题分析结果成功')
  }

  @Post('records/:recordId/result-analysis')
  @UseGuards(JwtAuthGuard)
  async createResumeQuizResultAnalysis(
    @Param('recordId') recordId: string,
    @Body() dto: ResumeQuizResultAnalysisDto,
    @Request() req: any,
  ) {
    const result = await this.interviewService.analyzeResumeQuizResultAnswers(
      req.user.userId,
      recordId,
      dto.answers,
    )

    return ResponseUtil.success(result, '生成答题分析结果成功')
  }

  @Post('records/:recordId/stage-two-questions')
  @UseGuards(JwtAuthGuard)
  async createStageTwoQuestionsJob(
    @Param('recordId') recordId: string,
    @Body() dto: ResumeQuizStageTwoDto,
    @Request() req: any,
  ) {
    const result = await this.interviewService.createStageTwoQuestionsJob(
      req.user.userId,
      recordId,
      dto.answers,
      dto.supplementaryContext,
    )

    return ResponseUtil.success(result, '第 2 阶段定制题任务已提交')
  }

  @Get('records/:recordId/stage-two-questions')
  @UseGuards(JwtAuthGuard)
  async getStageTwoQuestionsJob(
    @Param('recordId') recordId: string,
    @Request() req: any,
  ) {
    const result = await this.interviewService.getStageTwoQuestionsJob(
      req.user.userId,
      recordId,
    )

    return ResponseUtil.success(result, '获取第 2 阶段定制题状态成功')
  }

  @Post('records/:recordId/final-evaluation')
  @UseGuards(JwtAuthGuard)
  async createFinalEvaluationJob(
    @Param('recordId') recordId: string,
    @Body() dto: ResumeQuizFinalEvaluationDto,
    @Request() req: any,
  ) {
    const result = await this.interviewService.createFinalEvaluationJob(
      req.user.userId,
      recordId,
      dto.answers,
    )

    return ResponseUtil.success(result, '最终综合评价任务已提交')
  }

  @Get('records/:recordId/final-evaluation')
  @UseGuards(JwtAuthGuard)
  async getFinalEvaluationJob(
    @Param('recordId') recordId: string,
    @Request() req: any,
  ) {
    const result = await this.interviewService.getFinalEvaluationJob(
      req.user.userId,
      recordId,
    )

    return ResponseUtil.success(result, '获取最终综合评价状态成功')
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
    const response = res as Response & { flush?: () => void }
    const userId = req.user.userId
    let clientDisconnected = false
    // 设置SSE响应头
    response.status(200)
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.setHeader('X-Accel-Buffering', 'no') // 禁用 Nginx 缓冲
    response.flushHeaders?.()

    // 订阅进度事件
    const { stream, cancel } =
      this.interviewService.generateResumeQuizWithProgress(userId, dto)

    const subscription = stream.subscribe({
      next: (event) => {
        if (clientDisconnected || response.writableEnded) {
          return
        }
        // 发送SSE事件
        response.write(`data: ${JSON.stringify(event)}\n\n`)
        response.flush?.()
      },
      error: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.error(`简历押题流失败: ${message}`, error)
        if (clientDisconnected || response.writableEnded) {
          return
        }
        // 发送错误事件
        response.write(
          `data: ${JSON.stringify({ type: 'error', error: message })}\n\n`,
        )
        response.flush?.()
        response.end()
      },
      complete: () => {
        if (!clientDisconnected && !response.writableEnded) {
          response.end()
        }
      }, // 完成后关闭连接
    })

    // 客户端断开连接时取消订阅
    req.once('close', () => {
      clientDisconnected = true
      this.logger.log(`客户端断开简历押题流 userId=${userId}`)
      cancel()
      subscription.unsubscribe()
    })
  }

  /**
   * 根据 requestId 查询简历押题处理状态
   */
  @Get('resume/quiz/status')
  @UseGuards(JwtAuthGuard)
  async getResumeQuizStatus(
    @Query() query: ResumeQuizStatusDto,
    @Request() req: any,
  ) {
    const result = await this.interviewService.getResumeQuizRequestStatus(
      req.user.userId,
      query.requestId,
    )

    return ResponseUtil.success(result, '查询简历押题状态成功')
  }

  @Post('resume/parse-file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async parseResumeFile(
    @UploadedFile() file: { originalname: string; buffer: Buffer } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('请先上传简历文件')
    }

    const result = await this.interviewService.parseUploadedResume(
      file.originalname,
      file.buffer,
    )

    return ResponseUtil.success(result, '简历文件解析成功')
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
