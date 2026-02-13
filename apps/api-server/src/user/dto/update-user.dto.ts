import { IsEmail, IsOptional, IsString } from 'class-validator'

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nickname?: string
  // 用户昵称，非必填

  @IsString()
  @IsOptional()
  avatar?: string
  // 用户头像，存头像的 url 地址

  @IsEmail()
  @IsOptional()
  email?: string
  // 邮箱

  @IsString()
  @IsOptional()
  phone?: string
  // 手机号
}
