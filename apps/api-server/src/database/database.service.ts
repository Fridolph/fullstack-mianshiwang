import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  getConnectString(): string {
    return this.configService.getOrThrow<string>('MMONGODB_URI') + '/' + this.configService.get('DB_NAME')
  }

  getPort() {
    return this.configService.get<number>('API_PORT', 3000)
  }
}
