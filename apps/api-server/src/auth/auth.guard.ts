import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class CommonAuthGuard implements CanActivate {
  // ExecutionContext 当前执行上下文的信息
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.authorization as string

    // 未提供token拒绝请求
    if (!token) {
      throw new UnauthorizedException('未提供 token 认证令牌')
    }
    // 验证token（简化示例）
    if (!this.validateToken(token)) {
      throw new UnauthorizedException('token 认证令牌无效')
    }

    // 将用户信息附加到请求对象上
    request.user = this.getUserFromToken(token)

    return true
  }

  // TODO token实际验证逻辑
  private validateToken(token: string): boolean {
    return token.startsWith('Bearer ') && token.length > 12
  }

  private getUserFromToken(token: string) {
    return {
      id: 1,
      name: '临时测试用户',
    }
  }
}
