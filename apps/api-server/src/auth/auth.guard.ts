import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class AuthGuard implements CanActivate {
  // ExecutionContext 当前执行上下文的信息
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return true
  }
}
