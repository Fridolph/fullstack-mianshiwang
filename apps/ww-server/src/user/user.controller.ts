import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { AuthService } from '../auth/auth.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Public } from '../auth/public.decorator'
import { ResponseUtil } from '../common/utils/response.util'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.userService.register(registerDto)
    return ResponseUtil.success(result, '注册成功')
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto)
    return ResponseUtil.success(result, '登录成功')
  }

  @Get('info')
  async getUserInfo(@Request() req: any) {
    const { userId } = req.user
    const userInfo = await this.userService.getUserInfo(userId)
    return ResponseUtil.success(userInfo, '获取成功')
  }

  @Put('profile')
  async updateUserProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const { userId } = req.user
    const user = await this.userService.updateUser(userId, updateUserDto)
    return ResponseUtil.success(user, '更新成功')
  }

  @Get('consumption-records')
  @ApiOperation({
    summary: '获取用户消费记录',
    description: '获取用户所有的功能消费记录，包括简历押题、专项面试、综合面试等',
  })
  async getUserConsumptionRecords(
    @Request() req: any,
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 20,
  ) {
    const { userId } = req.user
    const result = await this.userService.getUserConsumptionRecords(userId, {
      skip,
      limit,
    })
    return ResponseUtil.success(result, '获取成功')
  }
}
