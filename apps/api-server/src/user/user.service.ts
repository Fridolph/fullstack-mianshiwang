import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from './schema/user.schema'
import { Model } from 'mongoose'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto

    // 检查用户名是否存在
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) throw new BadRequestException('用户名或邮箱已存在')

    // 校验通过，创建新用户
    // 密码加密会在 Schema 的 pre save 钩子里自动进行
    const newUser = new this.userModel({
      username,
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
