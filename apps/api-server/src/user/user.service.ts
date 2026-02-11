import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
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

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

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
}

// @Injectable()
// export class UserService {
//   constructor(
//     // @Inject('DATABASE_CONNECTION')
//     // private readonly dbConfig: any,
//     @InjectModel(User.name)
//     private userModel: Model<User>,
//   ) {
//     // console.log('数据库配置', this.dbConfig)
//   }

//   async create(createUserDto: any): Promise<User> {
//     // 这里密码会被自动加密
//     const user = new this.userModel(createUserDto)
//     return user.save()
//   }

//   async validatePassword(email: string, password: string): Promise<User> {
//     const user = await this.userModel.findOne({ email })
//     if (!user) {
//       throw new UnauthorizedException('用户不存在')
//     }

//     // 使用我们定义的方法比对密码
//     const isPasswordValid = await user.comparePassword(password)
//     if (!isPasswordValid) {
//       throw new UnauthorizedException('密码错误')
//     }

//     return user
//   }

//   async findAll(): Promise<User[]> {
//     return this.userModel.find().exec()
//   }

//   async findOne(id: number): Promise<User | null> {
//     return this.userModel.findById(id).exec()
//   }

//   async findByEmail(email: string): Promise<User | null> {
//     return this.userModel.findOne({ email }).exec()
//   }

//   async update(id: string, updateUserDto: any): Promise<User | null> {
//     return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec()
//   }

//   async delete(id: string): Promise<User | null> {
//     return this.userModel.findByIdAndDelete(id).exec()
//   }
// }
