import { Body, Controller, MessageEvent, Post, Request, Res, Sse, UseGuards } from '@nestjs/common'
// import { EventService } from '../common/services/event.service'
// import { map, Observable } from 'rxjs'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@Controller('interview')
export class InterviewController {
  /**
   * 简历押题
   */
  @Post('resume/quiz/stream')
  @UseGuards(JwtAuthGuard)
  async resumeQuizStream(@Body() dto, @Request() req, @Res() res) {}

  /**
   * 开始模拟面试
   */
  @Post('mock/start')
  @UseGuards(JwtAuthGuard)
  async startMockInterview(@Body() dto, @Request() req) {}

  /**
   * 回答面试问题
   */
  @Post('mock/answer')
  @UseGuards(JwtAuthGuard)
  async answerMockInterview(@Body() dto, @Request() req) {}

  /**
   * 结束面试
   */
  @Post('mock/end')
  @UseGuards(JwtAuthGuard)
  async endMockInterview(@Body() dto, @Request() req) {}
}

// 之前的demo 代码（用来模拟 sse socket 连接的）可以参考暂时保留了
// @Controller('interview')
// export class InterviewController {
//   constructor(private readonly eventService: EventService) {}

//   @Sse('stream')
//   stream(): Observable<MessageEvent> {
//     return this.eventService.generateTimedMessages().pipe(
//       map(
//         (message) =>
//           ({
//             data: JSON.stringify({
//               timestamp: new Date().toISOString(),
//               message,
//             }),
//           }) as MessageEvent,
//       ),
//     )
//   }
// }
