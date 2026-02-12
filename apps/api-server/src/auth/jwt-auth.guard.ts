import { Reflector } from '@nestjs/core'
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
    // 实现继承，调用父类 AuthGuard构造函数，传入 jwt 策略
  }

  /**
   * 判断是否允许请求通过 （是否有权限访问该接口）
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 获取当前处理方法的元数据
      context.getClass(), // 获取当前类的元数据
    ])
    // 如果接口被标记为公开接口，不需要验证token, 直接允许通过
    if (isPublic) return true

    // 否则，执行父类的 canActivate 方法，进行JWT认证
    return super.canActivate(context)
  }

  handleRequest(err, user, info: Error) {
    if (err || !user) {
      throw new UnauthorizedException(info?.message || '无效的 token')
    }
    return user
  }
}
