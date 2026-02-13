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
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserService } from './user.service'
import { RegisterDto } from './dto/register.dto'
import { ResponseUtil, ResponseUtil as ResUtil } from 'src/common/utils/response.util'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { Public } from 'src/auth/public.decorator'
import { InjectModel } from '@nestjs/mongoose'
import { User } from './schema/user.schema'
import { Model } from 'mongoose'
import { UpdateUserDto } from './dto/update-user.dto'

@ApiTags('用户')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * 注册用户
   */
  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.userService.register(registerDto)
    return ResUtil.success(result, '注册成功')
  }

  /**
   * 登录系统
   */
  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.login(loginDto)
    return ResUtil.success(result, '登录成功')
  }

  /**
   * 查询当前用户信息 （需要登录后，从 token 获取）
   */
  @Get('info')
  getUserInfo(@Request() req: any) {
    // req.user 就是从 Token 中提取出来的用户信息
    return this.userService.getUserInfo(req.user.userId)
  }

  @Put('profile')
  async updateUserProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const { userId } = req.user
    const user = await this.userService.updateUser(userId, updateUserDto)
    return ResponseUtil.success(user, '更新用户信息成功')
  }

  @Get('consumption-records')
  @ApiOperation({
    summary: '获取用户消费记录',
    description: '获取用户所有的功能消费记录，包括简历押题、专项面试、综合面试等',
  })
  async getUserConsumptionRecords(
    @Request() req: any,
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 0,
  ) {
    const { userId } = req.user
    const result = await this.userService.getUserConsumptionRecords(userId, {
      skip,
      limit,
    })
    return ResponseUtil.success(result, '获取成功')
  }
}
