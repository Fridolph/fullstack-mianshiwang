import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>()

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url } = request

    // 只缓存 GET 请求
    if (method !== 'GET') return next.handle()

    const cacheKey = url as string
    const cachedResponse = this.cache.get(cacheKey)

    if (cachedResponse) return of(cachedResponse)

    return next.handle().pipe(
      tap((data) => {
        // 缓存响应
        this.cache.set(cacheKey, data)
      }),
    )
  }
}
