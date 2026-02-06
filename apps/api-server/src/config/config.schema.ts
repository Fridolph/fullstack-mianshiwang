import * as Joi from 'joi'

export const configValidationSchema = Joi.object({
  // 环境
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // 端口
  PORT: Joi.number().default(3000),

  // 数据库
  MONGODB_URI: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(8).required().description('JWT_SECRET 至少需要 8 个字符'),

  // AI 配置
  // DEEPSEEK_API_KEY: Joi.string().required().description('DEEPSEEK_API_KEY 不能为空'),
  // DEEPSEEK_MODEL: Joi.string().default('deepseek-chat'),
  // MAX_TOKENS: Joi.number().default(4000),
})
