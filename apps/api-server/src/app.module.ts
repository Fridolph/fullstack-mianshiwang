import { LoggerMiddleware } from './common/middlewares/logger.middleware'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { InterviewModule } from './interview/interview.module'
import { SharedService } from './shared/shared.service'
import { SharedModule } from './shared/shared.module'
import { DatabaseModule } from './database/database.module'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

// 查找环境文件
const envFilePath = resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`)
console.log('尝试加载环境文件:', envFilePath)
console.log('文件存在:', existsSync(envFilePath))

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`),
      ignoreEnvFile: false,
      expandVariables: true,
    }),

    // 🔧 临时方案：直接使用硬编码 URI
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/mianshiwang', {
      // 添加连接选项
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }),

    DatabaseModule,
    // 导入业务模块
    UserModule,

    InterviewModule,

    SharedModule,
  ],
  controllers: [AppController],
  providers: [
    LoggerMiddleware,
    AppService,
    SharedService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
