import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DatabaseService } from './database.service'

@Module({
  imports: [
    // 确保注入 ConfigService，注： 在 AppModule里ConfigModule设为 global
    // 这里可不写，写上是为了知道，更清晰
    ConfigModule,
  ],
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'mongodb')
        if (dbType === 'mongodb') {
          return {
            type: 'mongodb',
            url: `${configService.get('MONGODB_URI')}/${configService.get('DB_NAME')}`,
          }
        } else if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get('POSTGRES_HOST'),
            port: configService.get('POSTGRES_PORT'),
            database: configService.get('POSTGRES_DB'),
          }
        } else {
          throw new Error(`不支持的数据库类型: ${dbType}`)
        }
      },
      inject: [ConfigService],
    },
    DatabaseService,
  ],
  exports: [
    'DATABASE_CONNECTION',
    DatabaseService, // 导出给其他模块使用
  ],
})
export class DatabaseModule {}
