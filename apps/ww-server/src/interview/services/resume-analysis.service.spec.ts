jest.mock('./interview-ai.service', () => ({
  InterviewAIService: class InterviewAIService {},
}))

import { Test, TestingModule } from '@nestjs/testing'
import { RESUME_ANALYSIS_PROMPT } from '../prompts/resume-analysis.prompts'
import { InterviewAIService } from './interview-ai.service'
import { ResumeAnalysisService } from './resume-analysis.service'

describe('ResumeAnalysisService', () => {
  let service: ResumeAnalysisService
  const interviewAIService = {
    invokeStructuredPrompt: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeAnalysisService,
        {
          provide: InterviewAIService,
          useValue: interviewAIService,
        },
      ],
    }).compile()

    service = module.get<ResumeAnalysisService>(ResumeAnalysisService)
  })

  it('should delegate structured resume analysis to interview ai service', async () => {
    interviewAIService.invokeStructuredPrompt.mockResolvedValue({ ok: true })

    const result = await service.analyze('resume', 'jd')

    expect(interviewAIService.invokeStructuredPrompt).toHaveBeenCalledWith(
      RESUME_ANALYSIS_PROMPT,
      {
        resume_content: 'resume',
        job_description: 'jd',
      },
      'stable',
    )
    expect(result).toEqual({ ok: true })
  })
})
