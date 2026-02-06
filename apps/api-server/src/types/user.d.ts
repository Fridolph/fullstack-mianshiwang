interface User {
  id?: number
  name?: string
  email?: string
  password?: string
  createdAt?: Date
  street?: Record<string, any>
  tags?: any[]
}
