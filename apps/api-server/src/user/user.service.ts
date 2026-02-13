import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from './schema/user.schema'
import { Model } from 'mongoose'
import { RegisterDto } from './dto/register.dto'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from './dto/login.dto'
import {
  checkLoginParamsComplete,
  checkRegisterParamsComplete,
  generateRandomUsername,
} from './utils/validate'
import { UpdateUserDto } from './dto/update-user.dto'
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 新用户注册
   * @param registerDto
   * @returns 当前注册用户信息（过滤掉密码）
   */
  async register(registerDto: RegisterDto) {
    if (!checkRegisterParamsComplete(registerDto)) {
      throw new BadRequestException('注册传参错误或缺失')
    }

    const { email, password } = registerDto

    // 检查用户名是否存在
    const existingUser = await this.userModel.findOne({
      $or: [{ email }],
    })
    if (existingUser) throw new BadRequestException('该邮箱已注册')

    const randomUsername = generateRandomUsername()
    const newUser = new this.userModel({
      username: randomUsername,
      email,
      password,
    })
    await newUser.save()

    // 这里返回用户信息（不返回密码）
    const result = newUser.toObject()
    // 使用解构方式排除password字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...resultWithoutPassword } = result

    return resultWithoutPassword
  }

  /**
   * 发起用户登录
   * @param loginDto
   * @returns 当前用户信息（过滤密码）+ token 信息
   */
  async login(loginDto: LoginDto) {
    if (!checkLoginParamsComplete(loginDto)) {
      throw new BadRequestException('参数错误，请检查后重试')
    }

    const { email, password } = loginDto
    // 1. 比对用户信息
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    // 2. 验证密码
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) throw new UnauthorizedException('邮箱或密码不正确')

    // 3. 生成 Token
    const token = this.jwtService.sign({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    // 4. 返回 Token 和用户信息
    const userInfo = user.toObject()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...filterdUserInfo } = userInfo

    return {
      token,
      user: filterdUserInfo,
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string) {
    const user = await this.userModel.findById(userId).lean()
    // lean 是 mongoose 优化方法，返回 js 对象 而不是 Mongoose Document 对象，查询快，占用内存少

    if (!user) {
      throw new NotFoundException('该查询用户不存在')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userFilterPwd } = user
    return userFilterPwd
  }

  /**
   * 更新用户信息
   * @param userId 通过 userId 查询用户
   * @param updateUserDto 传入修改参数
   * @returns 过滤掉敏感信息后的完整用户信息
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    // 如果更新邮箱，需检查新邮箱是否被使用
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: userId }, // 排除当前用户
      })

      if (existingUser) {
        throw new BadRequestException('邮箱已被使用')
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, {
        new: true,
        runValidators: true,
      })
      .select('-password')
      .lean()

    if (!user) throw new NotFoundException('用户不存在')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...updatedUser } = user
    return updatedUser
  }

  /**
   * 获取用户消费记录
   * @param userId 用户的唯一标识
   * @param options 可选查询参数
   * @returns 返回用户的消费记录和消费统计数据
   */
  async getUserConsumptionRecords(
    userId: string, // 用户ID，用于标识和查询特定用户的消费记录
    options?: {
      skip: number // 跳过记录数量
      limit: number // 每次查询的记录数量
    },
  ) {
    // 如果没有传递查询选项，则默认跳过0条记录，并限制返回20条记录
    const skip = options?.skip ?? 0
    const limit = options?.limit ?? 20

    // 查询消费记录，按创建时间降序排列，跳过skip记录，限制返回limit条记录
    const records = []
    // const records = await this.consumptionRecordModel
    //   .find({ userId }) // 根据用户ID查询消费记录
    //   .sort({ createdAt: -1 }) // 按照创建时间降序排列，最新的记录排在前面
    //   .skip(skip)
    //   .limit(limit)
    //   .lean()

    // 统计用户各类型的消费信息，使用 MongoDB的聚合框架
    const stats = await this.consumptionRecordModel.aggregate([
      { $match: { userId } }, // 过滤出属于当前用户的消费记录
      {
        $group: {
          // 按照消费类型进行分组
          _id: '$type', // 按消费类型进行分组
          count: { $sum: 1 }, // 统计每种类型的消费记录数量
          successCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          failedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
            },
          },
          totalCost: {
            $sum: '$estimatedCost', // 计算每种类型的消费总额
          },
        },
      },
    ])

    // 返回查询的消费记录和消费统计信息
    return {
      records,
      stats,
    }
  }
}
