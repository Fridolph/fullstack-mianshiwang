import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../auth/auth.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

describe('UserController', () => {
  let controller: UserController
  const userService = {
    register: jest.fn(),
    getUserInfo: jest.fn(),
    updateUser: jest.fn(),
    getUserConsumptionRecords: jest.fn(),
  }
  const authService = {
    login: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should delegate login to auth service', async () => {
    authService.login.mockResolvedValue({ token: 'token' })

    const result = await controller.login({
      email: 'test@example.com',
      password: '123456',
    })

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: '123456',
    })
    expect(result).toMatchObject({
      code: 200,
      message: '登录成功',
      data: { token: 'token' },
    })
  })
})
