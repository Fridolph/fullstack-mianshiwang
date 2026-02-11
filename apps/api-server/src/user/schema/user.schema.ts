import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import bcrypt from 'bcryptjs'

// @Schema({ _id: false })
// export class Profile {
//   @Prop()
//   bio: string

//   @Prop()
//   phone: string

//   @Prop()
//   avatar_url: string
// }

// const ProfileSchema = SchemaFactory.createForClass(Profile)

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
})
export class User extends Document {
  // -------------------- 基础认证字段 --------------------

  /**
   * 基础认证字段
   */
  @Prop({ required: true })
  username: string

  /**
   * 微信登录的唯一标识
   */
  @Prop({ required: false })
  wechatId: string

  /**
   * 用户邮箱
   */
  @Prop({
    required: false,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email?: string

  /**
   * 手机号码 - 目前只供国内用户 没有区号
   */
  @Prop({ required: false })
  phone?: string

  /**
   * 用户头像，可用 vx 后续让用户可设置
   */
  @Prop()
  avatar?: string

  /**
   * 用户角色/权限  支持多角色
   */
  @Prop({ default: ['user'] })
  roles: string[]

  /**
   * 账号是否激活
   */
  @Prop({ default: false })
  isActive: boolean

  /**
   * 通过三方登录可能没，要为用户刷个随机初始密码并能重置
   */
  @Prop({ minlength: 6 })
  password: string

  // -------------------- 用户个人信息 --------------------

  /**
   * 真实姓名
   */
  @Prop()
  realName?: string

  /**
   * 性别
   */
  @Prop({ enum: ['male', 'female', 'other'], default: 'other' })
  gender?: 'mail' | 'femail' | 'other'

  /**
   * 身份证号
   */
  @Prop()
  idCard?: string

  /**
   * 是否实名认证
   */
  @Prop({ default: false })
  isVerified: boolean

  /**
   * 出生年月日
   */
  @Prop()
  birthDate?: Date

  // -------------------- 高级用户信息 VIP --------------------

  /**
   * 是否为会员
   */
  @Prop({ default: false })
  isVip: boolean

  /**
   * 会员过期时间
   */
  @Prop()
  vipExpireTime?: Date

  // -------------------- 配额相关（这很关键） --------------------

  /**
   * AI模拟面试剩余次数
   */
  @Prop({ default: 0 })
  aiInterviewRemainingCount: number

  /**
   * AI模拟面试剩余时间（分钟）
   */
  @Prop({ default: 0 })
  aiInterviewRemainingMinutes: number

  /**
   * 简历押题剩余次数
   */
  @Prop({ default: 0 })
  resumeRemainingCount: number

  /**
   * 综合面试剩余次数
   */
  @Prop({ default: 0 })
  behaviorRemainingCount: number

  /**
   * 汪汪币余额
   */
  @Prop({ default: 0 })
  wwCoinBalance: number

  // -------------------- 用户行为追踪 --------------------

  /**
   * 最近登录时间
   */
  @Prop()
  lastLoginTime?: Date

  /**
   * 最近登录地点
   */
  @Prop()
  lastLoginLocation?: string

  // -------------------- 微信相关字段 --------------------
  @Prop({ unique: true, sparse: true })
  openid?: string
  // 微信用户的唯一标识（小程序）

  @Prop({ unique: true, sparse: true })
  unionid?: string
  // 微信开放平台统一标识

  @Prop()
  wechatNickname?: string
  // 微信昵称

  @Prop()
  wechatAvatar?: string
  // 微信头像

  @Prop({ default: true })
  isWechatBound: boolean
  // 是否绑定微信

  @Prop()
  wechatBoundTime?: Date
  // 微信绑定时间

  // readonly createdAt: Date
  // readonly updatedAt: Date

  // 添加comparePassword方法的声明
  comparePassword: (candidatePassword: string) => Promise<boolean>
}
export const UserSchema = SchemaFactory.createForClass(User)

// 添加 mongoose 钩子：保存前加密密码
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  const salt = await bcrypt.genSalt(10)
  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt)
  }
})

// 添加比较密码的方法
UserSchema.methods.comparePassword = async function (currentPassword: string) {
  return await bcrypt.compare(currentPassword, this.password)
}

// 下面是之前 demo 学习时的，暂时注释了

// 为 schema 添加了一个虚拟字段 isActive
// 定义了一个 getter 方法，当访问该字段时，会返回布尔值，表示用户的状态是否为 'active'
// UserSchema.virtual('isActive').get(function () {
//   return this.isActive
// })

// 为 schema 创建了两个索引
// UserSchema.index({ username: 1, email: 1 }) // 表示根据用户名和邮箱组合进行排序和查询
// UserSchema.index({ status: 1 }) // 表示根据状态进行排序和查询

// 添加 mongoose 钩子：保存前加密密码
// UserSchema.pre('save', async function () {
// this 指向当前文档
// 如果密码没有修改，就不用重新加密
// if (!this.isModified('password')) return
// 生成盐
// const salt = await bcrypt.genSalt(10)
// 用盐加密密码
// this.password = await bcrypt.hash(this.password, salt)
// })

// 添加钩子：保存后，打印日志
// UserSchema.post('save', function () {
//   console.log(`用户 ${this.username} 已保存`)
// })

// 修改后自动更新时间戳
// UserSchema.pre('findOneAndUpdate', function () {
//   this.set({
//     updatedAt: new Date(),
//   })
// })

// 添加方法：比对密码
// UserSchema.methods.comparePassword = async function (password: string) {
//   return bcrypt.compare(password, this.password)
// }

// 隐藏敏感字段
// UserSchema.methods.toJSON = function () {
//   const obj = this.toObject()
//   delete obj.password // 不返回密码
//   return obj
// }
