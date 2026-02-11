import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import * as express from 'express'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const port = process.env.APP_INTERCEPTORPORT ?? 6789

  app.setGlobalPrefix('api')
  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动移除 DTO 中没有声明的字段
      whitelist: true,
      // 有未声明字段就报错
      forbidNonWhitelisted: true,
      // 自动类型转换
      transform: true,
      transformOptions: {
        // 启用隐式转换
        enableImplicitConversion: true,
      },
    }),
  )

  // 启用CORS
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('AI 面试系统 API')
    .setDescription('AI面试系统API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .setContact('Fridolph', 'https://fridolph.top', '249121486@gmail.com')
    .addServer('http://localhost:6789', 'Development')
    .addServer('http://localhost:6789', 'Production')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  // 使用 Express 中间件
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  // 使用自定义中间件
  app.use((req, res, next) => {
    console.log('全局中间件')
    next()
  })
  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(port)

  console.log(`🚀 应用程序正在运行: http://localhost:${port}`)
}

bootstrap()
