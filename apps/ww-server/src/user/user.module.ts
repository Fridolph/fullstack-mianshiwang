import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthService } from '../auth/auth.service'
import {
  ConsumptionRecord,
  ConsumptionRecordSchema,
} from '../interview/schemas/consumption-record.schema'
import { UserController } from './user.controller'
import { User, UserSchema } from './schemas/user.schema'
import { UserConsumptionQueryService } from './services/user-consumption-query.service'
import { UserService } from './user.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ConsumptionRecord.name, schema: ConsumptionRecordSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserConsumptionQueryService, AuthService],
  exports: [UserService, UserConsumptionQueryService, AuthService],
})
export class UserModule {}
