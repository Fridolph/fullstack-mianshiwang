jest.mock('./services/interview.service', () => ({
  InterviewService: class InterviewService {},
}))

import { Test, TestingModule } from '@nestjs/testing'
import { InterviewController } from './interview.controller'
import { InterviewService } from './services/interview.service'

describe('InterviewController', () => {
  let controller: InterviewController
  const interviewService = {
    analyzeResume: jest.fn(),
    continueConversation: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewController],
      providers: [
        {
          provide: InterviewService,
          useValue: interviewService,
        },
      ],
    }).compile()

    controller = module.get<InterviewController>(InterviewController)
  })

  it('should delegate analyze resume with authenticated userId', async () => {
    interviewService.analyzeResume.mockResolvedValue({ sessionId: 's1' })

    const result = await controller.analyzeResume(
      {
        resume: 'resume',
        jobDescription: 'jd',
        position: 'backend',
      },
      { user: { userId: 'user-1' } },
    )

    expect(interviewService.analyzeResume).toHaveBeenCalledWith(
      'user-1',
      'backend',
      'resume',
      'jd',
    )
    expect(result).toMatchObject({
      code: 200,
      message: '简历分析成功',
      data: { sessionId: 's1' },
    })
  })

  it('should delegate continue conversation with authenticated userId', async () => {
    interviewService.continueConversation.mockResolvedValue('answer')

    const result = await controller.continueConversation(
      {
        sessionId: 's1',
        question: 'next?',
      },
      { user: { userId: 'user-1' } },
    )

    expect(interviewService.continueConversation).toHaveBeenCalledWith(
      'user-1',
      's1',
      'next?',
    )
    expect(result).toMatchObject({
      code: 200,
      message: '继续对话成功',
      data: { response: 'answer' },
    })
  })
})
