import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    let message: string
    let error: any

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
      error = null
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any
      message = responseObj?.message || '请求失败'
      error = responseObj?.error || null
    } else {
      message = '请求失败'
      error = null
    }

    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message[0] : message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request?.url,
      ...(error && { error }),
    })
  }
}
