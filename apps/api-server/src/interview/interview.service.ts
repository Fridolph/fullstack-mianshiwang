import { UserService } from './../user/user.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class InterviewService {
  constructor(private readonly userService: UserService) {}

  createInterview(userId: number, interviewData: any) {
    const user = this.userService.findOne(userId)
    if (!user) throw new Error('用户不存在')
    // ...
  }
}
