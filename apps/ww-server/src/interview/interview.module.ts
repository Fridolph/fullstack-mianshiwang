import { Module } from '@nestjs/common'
import { AIModule } from '../ai/ai.module'
import { InterviewController } from './interview.controller'
import { ConversationContinuationService } from './services/conversation-continuation.service'
import { DocumentParserService } from './services/document-parser.service'
import { InterviewAIService } from './services/interview-ai.service'
import { InterviewService } from './services/interview.service'
import { ResumeAnalysisService } from './services/resume-analysis.service'

@Module({
  imports: [AIModule],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    InterviewAIService,
    DocumentParserService,
    ResumeAnalysisService,
    ConversationContinuationService,
  ],
  exports: [
    InterviewService,
    InterviewAIService,
    DocumentParserService,
    ResumeAnalysisService,
    ConversationContinuationService,
  ],
})
export class InterviewModule {}
