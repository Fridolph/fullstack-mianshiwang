jest.mock('./interview-ai.service', () => ({
  InterviewAIService: class InterviewAIService {},
}))

import { Test, TestingModule } from '@nestjs/testing'
import { CONVERSATION_CONTINUATION_PROMPT } from '../prompts/resume-analysis.prompts'
import { InterviewAIService } from './interview-ai.service'
import { ConversationContinuationService } from './conversation-continuation.service'

describe('ConversationContinuationService', () => {
  let service: ConversationContinuationService
  const interviewAIService = {
    invokeTextPrompt: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationContinuationService,
        {
          provide: InterviewAIService,
          useValue: interviewAIService,
        },
      ],
    }).compile()

    service = module.get<ConversationContinuationService>(ConversationContinuationService)
  })

  it('should delegate text continuation to interview ai service', async () => {
    interviewAIService.invokeTextPrompt.mockResolvedValue('answer')

    const result = await service.continue([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hello' },
    ])

    expect(interviewAIService.invokeTextPrompt).toHaveBeenCalledWith(
      CONVERSATION_CONTINUATION_PROMPT,
      {
        history: 'system: sys\n\nuser: hello',
      },
      'default',
    )
    expect(result).toBe('answer')
  })
})
