import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import {
  ConsumptionRecord,
  ConsumptionRecordDocument,
} from '../interview/schemas/consumption-record.schema'
import { User, UserDocument } from './schemas/user.schema'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ConsumptionRecord.name)
    private consumptionRecordModel: Model<ConsumptionRecordDocument>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto

    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      throw new BadRequestException('用户名或邮箱已存在')
    }

    const newUser = new this.userModel({
      username,
      email,
      password,
    })

    await newUser.save()
    return this.sanitizeUser(newUser)
  }

  async validateUserCredentials(loginDto: LoginDto) {
    const { email, password } = loginDto

    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    return user
  }

  sanitizeUser<T extends { password?: string }>(user: T | (T & { toObject?: () => T })) {
    const plainUser = typeof (user as any)?.toObject === 'function'
      ? (user as any).toObject()
      : { ...user }

    delete plainUser.password
    return plainUser
  }

  async getUserInfo(userId: string) {
    const user = await this.userModel.findById(userId).lean()
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return this.sanitizeUser(user)
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: userId },
      })

      if (existingUser) {
        throw new BadRequestException('邮箱已被使用')
      }
    }

    const user = await this.userModel.findByIdAndUpdate(userId, updateUserDto, {
      new: true,
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return this.sanitizeUser(user)
  }

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
