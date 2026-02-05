// packages/config/src/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  // 添加其他环境变量
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
