import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

// 使用 @Injectable 使 JwtStrategy 可以被nestjs框架依赖注释到 系统管理
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // 用于传递 JWT 的配置选项
    super({
      // 从请求头 Authorization 提取 Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略 JWT 过期时间
      ignoreExpiration: false,
      // 获取 JWT 秘钥，从配置中取
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fridolph',
    })
  }

  /**
   * 该方法是JWT验证通过后执行的逻辑
   * @param payload 解密后的JWT数据
   * @returns 返回有效的用户信息（可以将其存储在请求的user对象中，后续中间件可以访问）
   */
  validate(payload: any) {
    if (!payload?.userId) {
      throw new UnauthorizedException('Token 无效')
    }

    return {
      userId: payload?.userId,
      username: payload?.username,
      roles: payload.roles || ['user'],
    }
  }
}
