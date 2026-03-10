import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  ConsumptionRecord,
  ConsumptionRecordDocument,
} from '../../interview/schemas/consumption-record.schema'

@Injectable()
export class UserConsumptionQueryService {
  constructor(
    @InjectModel(ConsumptionRecord.name)
    private readonly consumptionRecordModel: Model<ConsumptionRecordDocument>,
  ) {}

  async getUserConsumptionRecords(
    userId: string,
    options?: { skip: number; limit: number },
  ) {
    const skip = options?.skip || 0
    const limit = options?.limit || 20

    const records = await this.consumptionRecordModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const stats = await this.consumptionRecordModel.aggregate([
      { $match: { userId } },
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

    return {
      records,
      stats,
    }
  }
}
