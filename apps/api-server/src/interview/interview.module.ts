import { Module } from '@nestjs/common'
import { InterviewController } from './interview.controller'
import { InterviewService } from './interview.service'
import { UserModule } from 'src/user/user.module'
import { EventService } from '../common/services/event.service'

@Module({
  imports: [UserModule],
  controllers: [InterviewController],
  providers: [EventService, InterviewService],
})
export class InterviewModule {}
