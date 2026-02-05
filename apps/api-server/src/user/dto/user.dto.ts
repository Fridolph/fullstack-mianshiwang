import { Type } from 'class-transformer'
import { ValidateNested, IsString, IsEmail, IsNotEmpty, MinLength, IsObject, IsArray } from 'class-validator'

class AddressDto {
  @IsString({ message: '请输入街道' })
  @IsNotEmpty()
  street: string

  @IsString({ message: '请填写城市' })
  @IsNotEmpty()
  city: string
}

// export class CreateUserDto {
//   @IsString({ message: '用户名必须是字符串' })
//   @IsNotEmpty({ message: '用户名不能为空' })
//   @MinLength(2, { message: '用户ing至少2个字符' })
//   name: string

//   @IsEmail({}, { message: '邮箱格式不正确' })
//   @IsNotEmpty({ message: '邮箱不能为空' })
//   email: string

//   @IsString({ message: '密码必须是字符串' })
//   @IsNotEmpty({ message: '密码不能为空' })
//   @MinLength(6, { message: '密码至少6个字符' })
//   password: string
// }

class TagDto {
  @IsString()
  name: string
}

export class CreateUserDto {
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  address: AddressDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags: TagDto[]
}
