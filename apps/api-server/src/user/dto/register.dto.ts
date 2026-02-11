import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  username: string

  @IsNumberString()
  @IsOptional()
  phone: string

  @IsEmail()
  @IsOptional()
  email: string

  @IsString()
  @MinLength(6)
  @IsOptional()
  password: string
}
