import { Module } from '@nestjs/common'
import { InterviewController } from './interview.controller'
import { InterviewService } from './interview.service'
import { UserModule } from 'src/user/user.module'
// import { EventService } from '../common/services/event.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule,
    // TODO interview imports 需要访问多个数据表，后面完善

    UserModule,
  ],
  controllers: [InterviewController],
  providers: [
    // EventService,
    InterviewService,
    // InterviewAIService,
    // DocumentParserService,
  ],
  exports: [
    InterviewService,
    // InterviewAIService,
    // DocumentParserService,
  ],
})
export class InterviewModule {}
