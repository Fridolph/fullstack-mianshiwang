import { Controller, MessageEvent, Sse } from '@nestjs/common'
import { EventService } from '../common/services/event.service'
import { map, Observable } from 'rxjs'

@Controller('interview')
export class InterviewController {
  constructor(private readonly eventService: EventService) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.eventService.generateTimedMessages().pipe(
      map(
        (message) =>
          ({
            data: JSON.stringify({
              timestamp: new Date().toISOString(),
              message,
            }),
          }) as MessageEvent,
      ),
    )
  }
}
