import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from '../user/dto/login.dto'
import { UserService } from '../user/user.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  }
  const userService = {
    validateUserCredentials: jest.fn(),
    sanitizeUser: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UserService, useValue: userService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should delegate credential validation and sign token', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: '123456',
    }
    const user = {
      _id: { toString: () => 'user-1' },
      username: 'tester',
      email: 'test@example.com',
      roles: ['user'],
    }
    userService.validateUserCredentials.mockResolvedValue(user)
    userService.sanitizeUser.mockReturnValue({
      username: 'tester',
      email: 'test@example.com',
      roles: ['user'],
    })

    const result = await service.login(loginDto)

    expect(userService.validateUserCredentials).toHaveBeenCalledWith(loginDto)
    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'tester',
      email: 'test@example.com',
      roles: ['user'],
    })
    expect(result).toEqual({
      token: 'signed-token',
      user: {
        username: 'tester',
        email: 'test@example.com',
        roles: ['user'],
      },
    })
  })
})
