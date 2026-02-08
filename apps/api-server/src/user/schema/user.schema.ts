import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import bcrypt from 'bcryptjs'

@Schema({ _id: false })
export class Profile {
  @Prop()
  bio: string

  @Prop()
  phone: string

  @Prop()
  avatar_url: string
}

const ProfileSchema = SchemaFactory.createForClass(Profile)

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
})
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    index: true,
  })
  username: string

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email: string

  @Prop({
    required: true,
    minlength: 6,
  })
  password: string

  @Prop({
    type: ProfileSchema,
  })
  profile: Profile

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[]

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active',
    index: true,
  })
  status: string

  @Prop({
    type: Boolean,
    default: false,
  })
  isAdmin: boolean

  @Prop({
    type: Number,
    default: 0,
  })
  loginCount: number

  @Prop()
  lastLoginAt: Date

  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  // 添加comparePassword方法的声明
  comparePassword: (candidatePassword: string) => Promise<boolean>
}
export const UserSchema = SchemaFactory.createForClass(User)

// 为 schema 添加了一个虚拟字段 isActive
// 定义了一个 getter 方法，当访问该字段时，会返回布尔值，表示用户的状态是否为 'active'
UserSchema.virtual('isActive').get(function () {
  return this.status === 'active'
})

// 为 schema 创建了两个索引
UserSchema.index({ username: 1, email: 1 }) // 表示根据用户名和邮箱组合进行排序和查询
UserSchema.index({ status: 1 }) // 表示根据状态进行排序和查询

// 添加 mongoose 钩子：保存前加密密码
UserSchema.pre('save', async function() {
  // this 指向当前文档
  // 如果密码没有修改，就不用重新加密
  if (!this.isModified('password')) return
  // 生成盐
  const salt = await bcrypt.genSalt(10)
  // 用盐加密密码
  this.password = await bcrypt.hash(this.password, salt)
})

// 添加钩子：保存后，打印日志
UserSchema.post('save', function() {
  console.log(`用户 ${this.username} 已保存`)
})

// 修改后自动更新时间戳
UserSchema.pre('findOneAndUpdate', function() {
  this.set({
    updatedAt: new Date(),
  })
})

// 添加方法：比对密码
UserSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password)
}

// 隐藏敏感字段
UserSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password // 不返回密码
  return obj
}
