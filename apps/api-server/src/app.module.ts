import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { InterviewModule } from './interview/interview.module';
import { SharedService } from './shared/shared.service';
import { SharedModule } from './shared/shared.module';
import * as path from 'path'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`),
      ignoreEnvFile: false,
      expandVariables: true,
    }),

    // 🔧 临时方案：直接使用硬编码 URI
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/mianshiwang', {
      // 添加连接选项
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }),

    // 导入业务模块
    UserModule,

    InterviewModule,

    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService, SharedService],
})
export class AppModule {}
