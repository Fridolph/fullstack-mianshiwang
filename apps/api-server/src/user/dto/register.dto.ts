import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class RegisterDto {
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
