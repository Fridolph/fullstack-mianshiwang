import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { DatabaseModule } from 'src/database/database.module'
import { User, UserSchema } from './schema/user.schema'
import { MongooseModule } from '@nestjs/mongoose'
import {
  ConsumptionRecord,
  ConsumptionRecordSchema,
} from '../interview/schema/consumption-record.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ConsumptionRecord.name, schema: ConsumptionRecordSchema },
    ]),
    DatabaseModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
