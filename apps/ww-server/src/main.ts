import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Logger, ValidationPipe } from '@nestjs/common'

function normalizeCorsOrigins(origins: string): string[] {
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isAllowedDevOrigin(origin: string, allowlist: string[]): boolean {
  if (allowlist.includes(origin)) {
    return true
  }

  return [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/10\.10\.70\.216:\d+$/
  ].some((pattern) => pattern.test(origin))
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')
  const corsOrigins = normalizeCorsOrigins(
    configService.get<string>('CORS_ORIGINS') || '',
  )

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    // 全局验证管道
    new ValidationPipe({
      whitelist: true, // 自动移除 DTO 中没有声明的字段
      transform: true, // 自动类型转换
    }),
  )

  app.enableCors({
    credentials: true,
    origin(origin, callback) {
      // Postman / 服务端直连等场景没有 Origin，直接放行。
      if (!origin) {
        callback(null, true)
        return
      }

      if (isAllowedDevOrigin(origin, corsOrigins)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked origin: ${origin}`), false)
    },
  })

  const port = Number(
    configService.get<string>('PORT')
    || configService.get<string>('API_PORT')
    || 3000,
  )
  const host
    = configService.get<string>('API_HOST')
      || configService.get<string>('HOST')
      || '0.0.0.0'

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
