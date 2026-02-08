import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from './schema/user.schema'
import { Model } from 'mongoose'

@Injectable()
export class UserService {
  constructor(
    // @Inject('DATABASE_CONNECTION')
    // private readonly dbConfig: any,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {
    // console.log('数据库配置', this.dbConfig)
  }

  async create(createUserDto: any): Promise<User> {
    const user = new this.userModel(createUserDto)
    return user.save()
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec()
  }

  async findOne(id: number): Promise<User | null> {
    return this.userModel.findById(id).exec()
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec()
  }

  async update(id: string, updateUserDto: any): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec()
  }

  async delete(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec()
  }
}
