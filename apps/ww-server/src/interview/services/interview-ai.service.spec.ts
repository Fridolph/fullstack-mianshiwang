jest.mock('@langchain/core/prompts', () => ({
  PromptTemplate: {
    fromTemplate: jest.fn(),
  },
}))

jest.mock('@langchain/core/output_parsers', () => ({
  JsonOutputParser: jest.fn().mockImplementation(() => ({
    parser: true,
  })),
}))

jest.mock('../../ai/services/ai-model.factory', () => ({
  AIModelFactory: class AIModelFactory {},
}))

import { Test, TestingModule } from '@nestjs/testing'
import { PromptTemplate } from '@langchain/core/prompts'
import { AIModelFactory } from '../../ai/services/ai-model.factory'
import { InterviewAIService } from './interview-ai.service'

describe('InterviewAIService', () => {
  let service: InterviewAIService
  const invoke = jest.fn()
  const aiModelFactory = {
    createDefaultModel: jest.fn(() => ({ model: 'default-model' })),
    createStableModel: jest.fn(() => ({ model: 'stable-model' })),
    createCreativeModel: jest.fn(() => ({ model: 'creative-model' })),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewAIService,
        {
          provide: AIModelFactory,
          useValue: aiModelFactory,
        },
      ],
    }).compile()

    service = module.get<InterviewAIService>(InterviewAIService)
  })

  it('should use stable model for structured prompt', async () => {
    invoke.mockResolvedValue({ score: 99 })
    ;(PromptTemplate.fromTemplate as jest.Mock).mockReturnValue({
      pipe: jest.fn(() => ({
        pipe: jest.fn(() => ({ invoke })),
      })),
    })

    const result = await service.invokeStructuredPrompt(
      'template',
      { foo: 'bar' },
      'stable',
    )

    expect(aiModelFactory.createStableModel).toHaveBeenCalled()
    expect(PromptTemplate.fromTemplate).toHaveBeenCalledWith('template')
    expect(invoke).toHaveBeenCalledWith({ foo: 'bar' })
    expect(result).toEqual({ score: 99 })
  })

  it('should normalize text response content', async () => {
    invoke.mockResolvedValue({ content: 'answer' })
    ;(PromptTemplate.fromTemplate as jest.Mock).mockReturnValue({
      pipe: jest.fn(() => ({ invoke })),
    })

    const result = await service.invokeTextPrompt(
      'template',
      { history: 'h' },
      'default',
    )

    expect(aiModelFactory.createDefaultModel).toHaveBeenCalled()
    expect(result).toBe('answer')
  })
})
