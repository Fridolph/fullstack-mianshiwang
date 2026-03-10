import { Injectable, Logger } from '@nestjs/common'
import { RESUME_ANALYSIS_PROMPT } from '../prompts/resume-analysis.prompts'
import { InterviewAIService } from './interview-ai.service'

/**
 * 简历分析服务，负责简历分析的业务上下文
 * - 管理简历分析的 Prompt
 * - 提供简历分析所需变量
 * - 把结构化输出委托给 InterviewAIService
 */
@Injectable()
export class ResumeAnalysisService {
  private readonly logger = new Logger(ResumeAnalysisService.name)

  constructor(private interviewAIService: InterviewAIService) {}

  async analyze(resumeContent: string, jobDescription: string): Promise<any> {
    try {
      this.logger.log('开始分析简历 ...')
      const result = await this.interviewAIService.invokeStructuredPrompt(
        RESUME_ANALYSIS_PROMPT,
        {
          resume_content: resumeContent,
          job_description: jobDescription,
        },
        'stable',
      )
      this.logger.log('简历分析完成')
      return result
    }
    catch (error) {
      this.logger.error('简历分析失败', error)
      throw error
    }
  }
}
