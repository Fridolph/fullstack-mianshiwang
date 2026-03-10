import { NotFoundException } from '@nestjs/common'
import { SessionManager } from './session.manager'

describe('SessionManager', () => {
  let service: SessionManager

  beforeEach(() => {
    service = new SessionManager()
  })

  it('should throw not found when session does not exist', () => {
    expect(() => service.getSessionOrThrow('missing')).toThrow(NotFoundException)
  })
})
