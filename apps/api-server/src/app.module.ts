import { LoggerMiddleware } from './common/middlewares/logger.middleware'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { InterviewModule } from './interview/interview.module'
import { SharedService } from './shared/shared.service'
import { SharedModule } from './shared/shared.module'
import { DatabaseModule } from './database/database.module'
import { resolve } from 'node:path'
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
// import { CommonAuthGuard } from './auth/common.auth.guard'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './auth/jwt.strategy'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { configValidationSchema } from './config/config.schema'
import { PaymentModule } from './payment/payment.module'
import { ResumeModule } from './resume/resume.module'
import { WechatModule } from './wechat/wechat.module'
import { AdminModule } from './admin/admin.module'
import { StsModule } from './sts/sts.module'

const envFilePath = resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}.local`)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wwzhidao'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      ignoreEnvFile: false,
      expandVariables: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // 🔧 临时方案：直接使用硬编码 URI
    MongooseModule.forRoot(mongoUri, {
      // 添加连接选项
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }),

    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: async(configService: ConfigService) => {
    //     const expirationSeconds = getTokenExpirationSeconds()
    //     return {
    //       secret: configService.get<string>('JWT_SECRET' || 'wwzhidao-secret'),
    //       signOptions: {
    //         expiresIn: expirationSeconds,
    //       }
    //     }
    //   },
    //   inject: [ConfigService],
    //   global: true,
    // }),

    SharedModule,
    DatabaseModule,
    // 导入业务模块
    UserModule,
    // ResumeModule,
    // WechatModule,
    // PaymentModule,
    // StsModule,
    // AdminModule,
    InterviewModule,
    PaymentModule,
    ResumeModule,
    WechatModule,
    AdminModule,
    StsModule,
  ],

  controllers: [AppController],

  providers: [
    LoggerMiddleware,
    AppService,
    JwtStrategy,
    SharedService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: CommonAuthGuard,
    // },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
