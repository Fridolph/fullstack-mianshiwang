import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from '../user/dto/login.dto'
import { UserService } from '../user/user.service'
import { JwtPayload } from './interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.validateUserCredentials(loginDto)
    const sanitizedUser = this.userService.sanitizeUser(user)

    return {
      token: this.jwtService.sign(this.createJwtPayload(user)),
      user: sanitizedUser,
    }
  }

  private createJwtPayload(user: {
    _id: { toString(): string }
    username: string
    email?: string
    roles?: string[]
  }): JwtPayload {
    return {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: user.roles ?? ['user'],
    }
  }
}
