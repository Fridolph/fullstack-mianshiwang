import { IsEmail, IsNumberString, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(2)
  username: string

  @IsNumberString()
  phone?: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string
}
