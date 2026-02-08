import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards, Request, NotFoundException } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/user.dto'
// import { Roles, RolesGuard } from 'src/auth/roles.guard'
// import { CommonAuthGuard } from 'src/auth/common.auth.guard'
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'

@Controller('user')
// @UseGuards(CommonAuthGuard) // user 的所有路由都需要验证
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    if (id > 100) {
      throw new NotFoundException(`用户 ID ${id} 不存在`)
    }
    return this.userService.findOne(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: { name?: string; email?: string }): Promise<User | null> {
    return this.userService.update(id.toString(), updateUserDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    return this.userService.delete(id.toString())
  }

  // @Get('info')
  // getInfo(@Request() req: any) {
  //   // req.user 包含从 JWT 中解析的用户信息
  //   return req?.user
  // }

  // @Get('admin')
  // @UseGuards(RolesGuard)
  // @Roles('admin')
  // getAdminInfo(@Request() req: any) {
  //   // 只有 admin 角色可以访问
  //   return {
  //     message: '管理员信息',
  //     data: req?.user,
  //   }
  // }
}
