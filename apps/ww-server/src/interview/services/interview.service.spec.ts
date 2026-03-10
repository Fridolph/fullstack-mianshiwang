jest.mock('./resume-analysis.service', () => ({
  ResumeAnalysisService: class ResumeAnalysisService {},
}))

jest.mock('./conversation-continuation.service', () => ({
  ConversationContinuationService: class ConversationContinuationService {},
}))

import { ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SessionManager } from '../../ai/services/session.manager'
import { ConversationContinuationService } from './conversation-continuation.service'
import { InterviewService } from './interview.service'
import { ResumeAnalysisService } from './resume-analysis.service'

describe('InterviewService', () => {
  let service: InterviewService
  const configService = {}
  const sessionManager = {
    createSession: jest.fn(),
    addMessage: jest.fn(),
    getRecentMessages: jest.fn(),
    getSessionOrThrow: jest.fn(),
  }
  const resumeAnalysisService = {
    analyze: jest.fn(),
  }
  const conversationContinuationService = {
    continue: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        { provide: ConfigService, useValue: configService },
        { provide: SessionManager, useValue: sessionManager },
        { provide: ResumeAnalysisService, useValue: resumeAnalysisService },
        {
          provide: ConversationContinuationService,
          useValue: conversationContinuationService,
        },
      ],
    }).compile()

    service = module.get<InterviewService>(InterviewService)
  })

  it('should reject accessing session owned by another user', async () => {
    sessionManager.getSessionOrThrow.mockReturnValue({ userId: 'other-user' })

    await expect(
      service.continueConversation('user-1', 'session-1', 'hello'),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(conversationContinuationService.continue).not.toHaveBeenCalled()
  })

  it('should continue conversation for session owner', async () => {
    sessionManager.getSessionOrThrow.mockReturnValue({ userId: 'user-1' })
    sessionManager.getRecentMessages.mockReturnValue([
      { role: 'system', content: 's' },
      { role: 'user', content: 'hello' },
    ])
    conversationContinuationService.continue.mockResolvedValue('answer')

    const result = await service.continueConversation(
      'user-1',
      'session-1',
      'hello',
    )

    expect(sessionManager.addMessage).toHaveBeenNthCalledWith(
      1,
      'session-1',
      'user',
      'hello',
    )
    expect(conversationContinuationService.continue).toHaveBeenCalled()
    expect(sessionManager.addMessage).toHaveBeenNthCalledWith(
      2,
      'session-1',
      'assistant',
      'answer',
    )
    expect(result).toBe('answer')
  })
})
