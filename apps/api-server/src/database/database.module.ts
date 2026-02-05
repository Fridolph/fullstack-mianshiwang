import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (configService: ConfigService) => {
        // 添加调试信息，打印所有环境变量
        // console.log('环境变量 NODE_ENV:', process.env.NODE_ENV)
        // console.log('MONGODB_URI 环境变量值:', configService.get('MONGODB_URI'))
        // console.log('DB_NAME 环境变量值:', configService.get('DB_NAME'))

        const dbType = configService.get('DB_TYPE', 'mongodb')
        if (dbType === 'mongodb') {
          // 使用进程环境变量作为备选
          const mongoUri = configService.get('MONGODB_URI') || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
          const dbName = configService.get('DB_NAME') || process.env.DB_NAME || 'mianshiwang'

          return {
            type: 'mongodb',
            url: mongoUri,
            database: dbName,
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
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}
