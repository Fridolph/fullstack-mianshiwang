import { Injectable } from '@nestjs/common'
import { interval, map, Observable, Subject, tap } from 'rxjs'

@Injectable()
export class EventService {
  // 创建一个 Subject 用来广播事件
  private eventSubject = new Subject<string>()

  /**
   * 发送一个事件
   * @param message
   */
  emit(message: string) {
    this.eventSubject.next(message)
  }

  /**
   * 获取事件流的 Observable
   */
  getEvents(): Observable<string> {
    return this.eventSubject.asObservable()
  }

  generateTimedMessages(): Observable<string> {
    return interval(1000).pipe(
      map((count) => `这是第 ${count + 1} 条消息`),
      tap((message) => {
        console.log('推送消息', message)
      }),
    )
  }
}
