import { Inject, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class UserService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly dbConfig: any,
  ) {
    console.log('数据库配置', this.dbConfig)
  }

  private users: User[] = [
    { id: 1, name: '张三', password: '12345678', email: 'zhangsan@example.com', createdAt: new Date('2025-01-01') },
    { id: 2, name: '李四', password: 'aaaccc12345678', email: 'lisi@example.com', createdAt: new Date('2026-01-02') },
    { id: 3, name: '王五', password: 'bbbb12345678', email: 'wangwu@example.com', createdAt: new Date('2027-01-03') },
  ]

  findAll(): User[] {
    return this.users
  }

  findOne(id: number): User {
    const user = this.users.find((user) => user.id === id)

    if (!user) throw new NotFoundException(`用户 ID: ${id} 不存在`)

    return user
  }

  create(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      id: this.users.length + 1,
      ...user,
    }
    this.users.push(newUser)
    return newUser
  }

  update(id: number, userData: Partial<Omit<User, 'id' | 'createdAt'>>): User {
    // const index = this.users.findIndex((user) => user.id === id)
    // 改为下面这样可以复用 findOne 方法中的异常处理逻辑
    const user = this.findOne(id)
    Object.assign(user, userData)

    return user
  }

  remove(id: number): void {
    const index = this.users.findIndex((user) => user.id === id)
    if (index === -1) {
      throw new NotFoundException(`用户 ID: ${id} 不存在`)
    }
    this.users.splice(index, 1)
  }
}
