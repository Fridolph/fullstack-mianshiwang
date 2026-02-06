import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UsePipes, UseGuards, Request } from '@nestjs/common'
import { UserService } from './user.service'
import type { User } from './user.service'
import { CreateUserDto } from './dto/user.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { RolesGuard } from 'src/auth/roles.guard'

@Controller('user')
@UseGuards(JwtAuthGuard) // user 的所有路由都需要验证
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): User[] {
    return this.userService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): User {
    const user = this.userService.findOne(id)
    return user
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto): User {
    return this.userService.create(createUserDto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: { name?: string; email?: string }): User {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id)
  }

  @Get('info')
  getInfo(@Request() req: any) {
    // req.user 包含从 JWT 中解析的用户信息
    return req?.user
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAdminInfo(@Request() req: any) {
    // 只有 admin 角色可以访问
    return {
      message: '管理员信息',
      data: req?.user,
    }
  }
}
