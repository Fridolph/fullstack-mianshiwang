import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // 获取端口号，提供默认值
  const port = configService.get<number>('API_PORT', 6789)
  // const env = configService.get<string>('NODE_ENV', 'dev')
  // const mongoUri = configService.get<string>('MONGODB_URI')
  app.setGlobalPrefix('api')
  // 启用 CORS（如果需要）
  app.enableCors({
    origin: ['http://localhost:4001'],
    credentials: true,
  })
  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const config = new DocumentBuilder().setTitle('Mianshiwang API').setDescription('The Mianshiwang API description').setVersion('1.0').build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  await app.listen(port)

  console.log(`🚀 应用程序正在运行: http://localhost:${port}`)
}

bootstrap()
