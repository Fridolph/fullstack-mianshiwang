import { UnauthorizedException } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { ConsumptionRecord } from '../interview/schemas/consumption-record.schema'
import { User } from './schemas/user.schema'
import { UserService } from './user.service'

describe('UserService', () => {
  let service: UserService
  const userModel = {
    findOne: jest.fn(),
  }
  const consumptionRecordModel = {
    find: jest.fn(),
    aggregate: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: getModelToken(ConsumptionRecord.name),
          useValue: consumptionRecordModel,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should sanitize password from user object', () => {
    const result = service.sanitizeUser({
      username: 'tester',
      password: 'secret',
    })

    expect(result).toEqual({ username: 'tester' })
  })

  it('should validate user credentials', async () => {
    const user = {
      comparePassword: jest.fn().mockResolvedValue(true),
    }
    userModel.findOne.mockResolvedValue(user)

    const result = await service.validateUserCredentials({
      email: 'test@example.com',
      password: '123456',
    })

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    expect(user.comparePassword).toHaveBeenCalledWith('123456')
    expect(result).toBe(user)
  })

  it('should reject invalid credentials', async () => {
    userModel.findOne.mockResolvedValue(null)

    await expect(
      service.validateUserCredentials({
        email: 'test@example.com',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
