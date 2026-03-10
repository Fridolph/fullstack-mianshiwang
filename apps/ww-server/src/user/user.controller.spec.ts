import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../auth/auth.service'
import { UserConsumptionQueryService } from './services/user-consumption-query.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

describe('UserController', () => {
  let controller: UserController
  const userService = {
    register: jest.fn(),
    getUserInfo: jest.fn(),
    updateUser: jest.fn(),
  }
  const authService = {
    login: jest.fn(),
  }
  const userConsumptionQueryService = {
    getUserConsumptionRecords: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        {
          provide: UserConsumptionQueryService,
          useValue: userConsumptionQueryService,
        },
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

  it('should delegate consumption query to dedicated query service', async () => {
    userConsumptionQueryService.getUserConsumptionRecords.mockResolvedValue({
      records: [],
      stats: [],
    })

    const result = await controller.getUserConsumptionRecords(
      { user: { userId: 'user-1' } },
      5,
      10,
    )

    expect(userConsumptionQueryService.getUserConsumptionRecords).toHaveBeenCalledWith(
      'user-1',
      { skip: 5, limit: 10 },
    )
    expect(result).toMatchObject({
      code: 200,
      message: '获取成功',
      data: { records: [], stats: [] },
    })
  })
})
