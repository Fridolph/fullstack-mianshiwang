import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class LoginDto {
  @IsEmail()
  @IsOptional()
  email: string // 用户邮箱

  @IsNumberString()
  @IsOptional()
  phone: string // 手机号码

  @IsString()
  @ValidateIf(o => !!o.phone) // 只有在提供phone字段时，验证码才是必需的
  captcha: string // 验证码

  @IsString()
  @ValidateIf(o => !o.phone)
  @MinLength(6)
  password: string // 只有在没有phone字段时，密码才是必需的
}
