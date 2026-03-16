import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Logger, ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    // 全局验证管道
    new ValidationPipe({
      whitelist: true, // 自动移除 DTO 中没有声明的字段
      transform: true, // 自动类型转换
    }),
  )

  app.enableCors()

  const port = Number(configService.get<string>('PORT') || 3000)
  const host = configService.get<string>('API_HOST') || '0.0.0.0'

  await app.listen(port, host)

  logger.log(`Server ready at http://localhost:${port}/api`)
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap')
  const errorMessage =
    error instanceof Error ? error.stack || error.message : String(error)
  logger.error(`Failed to start server: ${errorMessage}`)
  process.exit(1)
})
