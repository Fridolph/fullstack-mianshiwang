import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  })
  username: string

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // 简单的邮箱验证
  })
  email: string

  @Prop({
    required: true,
    minlength: 6,
  })
  password: string

  @Prop({
    type: Number,
    min: 0,
    max: 150,
  })
  age: number

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active',
  })
  status: string

  @Prop({
    type: Boolean,
    default: false,
  })
  isAdmin: boolean

}
export const UserSchema = SchemaFactory.createForClass(User)
