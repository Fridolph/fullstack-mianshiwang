import { AIModelFactory } from '../../ai/services/ai-model.factory'
import { Injectable, Logger } from '@nestjs/common'
import { PromptTemplate } from '@langchain/core/prompts'
import { RESUME_ANALYSIS_PROMPT } from '../prompts/resume-analysis.prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'

/**
 * 简历分析服务，负责简历分析的 AI Chain
 * - 管理简历分析的 Prompt
 * - 初始化分析 Chain
 * - 调用 AI 进行分析
 *
 * 为什么要单独提取这个服务？
 * 因为建立分析涉及特定的 Prompt 和 Chain，将来可能还有其他分析（编程题分析、答题分析等）
 * 每个分析都有自己的 Prompt 和 Chain，所以我们为每个分析创建一个独立的服务
 *
 * InterviewService 只关心会话管理，不关心具体的分析逻辑
 */
@Injectable()
export class ResumeAnalysisService {
  private readonly logger = new Logger(ResumeAnalysisService.name)

  constructor(private aiModelFactory: AIModelFactory) {}

  async analyze(resumeContent: string, jobDescription: string): Promise<any> {
    // 1、创建Prompt模版
    const prompt = PromptTemplate.fromTemplate(RESUME_ANALYSIS_PROMPT)
    // 2、获取模型
    const model = this.aiModelFactory.createDefaultModel()
    // 3、创建输出解析器
    const parser = new JsonOutputParser()
    // 4、组建链
    const chain = prompt.pipe(model).pipe(parser)

    try {
      this.logger.log('开始分析简历 ...')
      // 5、调用链
      const result = await chain.invoke({
        resume_content: resumeContent,
        job_description: jobDescription,
      })
      this.logger.log('简历分析完成')
      return result
    } catch (error) {
      this.logger.error('简历分析失败', error)
      throw error
    }
  }
}
