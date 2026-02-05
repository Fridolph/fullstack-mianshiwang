import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'
import type { ZodSchema } from 'zod'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value)
    } catch (error) {
      throw new BadRequestException('Validation failed', error as string)
    }
  }
}
