import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { ConsumptionRecord } from '../../interview/schemas/consumption-record.schema'
import { UserConsumptionQueryService } from './user-consumption-query.service'

describe('UserConsumptionQueryService', () => {
  let service: UserConsumptionQueryService
  const queryChain = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn(),
  }
  const consumptionRecordModel = {
    find: jest.fn(() => queryChain),
    aggregate: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    queryChain.sort.mockReturnValue(queryChain)
    queryChain.skip.mockReturnValue(queryChain)
    queryChain.limit.mockReturnValue(queryChain)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConsumptionQueryService,
        {
          provide: getModelToken(ConsumptionRecord.name),
          useValue: consumptionRecordModel,
        },
      ],
    }).compile()

    service = module.get<UserConsumptionQueryService>(UserConsumptionQueryService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should query records and aggregate stats', async () => {
    const records = [{ id: 'record-1' }]
    const stats = [{ _id: 'resume_quiz', count: 1 }]
    queryChain.lean.mockResolvedValue(records)
    consumptionRecordModel.aggregate.mockResolvedValue(stats)

    const result = await service.getUserConsumptionRecords('user-1', {
      skip: 10,
      limit: 5,
    })

    expect(consumptionRecordModel.find).toHaveBeenCalledWith({ userId: 'user-1' })
    expect(queryChain.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(queryChain.skip).toHaveBeenCalledWith(10)
    expect(queryChain.limit).toHaveBeenCalledWith(5)
    expect(consumptionRecordModel.aggregate).toHaveBeenCalledWith([
      { $match: { userId: 'user-1' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          totalCost: { $sum: '$estimatedCost' },
        },
      },
    ])
    expect(result).toEqual({ records, stats })
  })
})
