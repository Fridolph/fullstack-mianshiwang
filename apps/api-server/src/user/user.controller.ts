import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UsePipes } from '@nestjs/common'
import { UserService } from './user.service'
import type { User } from './user.service'
import { CreateUserDto } from './dto/user.dto'

@Controller('user')
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
}
