import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthenticatedUser } from './interfaces/authenticated-user.interface'
import { JwtPayload } from './interfaces/jwt-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'wwzhidao-secret-key',
    })
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles ?? ['user'],
    }
  }
}
