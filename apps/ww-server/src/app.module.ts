import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { WechatModule } from './wechat/wechat.module'
import { PaymentModule } from './payment/payment.module'
import { StsModule } from './sts/sts.module'
import { InterviewModule } from './interview/interview.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { JwtStrategy } from './auth/jwt.strategy'
import { resolve } from 'node:path'

const nodeEnv = process.env.NODE_ENV || 'development'
const envFilePath = [
  resolve(process.cwd(), `.env.${nodeEnv}.local`),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
]

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017',
        dbName: configService.get<string>('DB_NAME') || 'wwzhidao',
        retryAttempts: 2,
        retryDelay: 1000,
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET') || 'wwzhidao-secret',
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
          },
        }
      },
      inject: [ConfigService],
      global: true,
    }),
    UserModule,
    WechatModule,
    PaymentModule,
    StsModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
