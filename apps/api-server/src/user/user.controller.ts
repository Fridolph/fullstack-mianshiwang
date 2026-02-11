import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards, Request, NotFoundException } from '@nestjs/common'
import { UserService } from './user.service'
import { User } from './schema/user.schema'
import { User as CreateUserDto } from './dto/user.dto'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
// import { Roles, RolesGuard } from 'src/auth/roles.guard'
// import { CommonAuthGuard } from 'src/auth/common.auth.guard'

@ApiTags('用户')
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
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: '获取当前用户信息',
  //   description: '获取当前登录用户的个人信息',
  // })
  // @UseGuards(JwtAuthGuard)
  // async getUserInfo(@Request() req: any) {
  //   return this.userService.getUserInfo(req.user.userId)
  // }
}
