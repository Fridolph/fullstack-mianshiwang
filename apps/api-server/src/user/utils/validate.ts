import { LoginDto } from '../dto/login.dto'
import { RegisterDto } from '../dto/register.dto'

export function checkLoginParamsComplete(loginDto: LoginDto): boolean {
  // 修正这里，应该是loginDto实例而不是LoginDto类型
  const { phone, email, password, captcha } = loginDto

  // 至少需要提供一种登录方式
  if (!phone && !email) return false

  // 手机号登录需要验证码
  if (phone) {
    if (!captcha) return false // 手机登录必须提供验证码
    return true // 手机号+验证码满足条件
  }

  // 邮箱登录需要密码
  if (email) {
    if (!password) return false // 邮箱登录必须提供密码
    return true // 邮箱+密码满足条件
  }

  // 如果代码执行到这里，说明参数不完整
  return false
}

// 校验通过，创建新用户
// 密码加密会在 Schema 的 pre save 钩子里自动进行
// 生成随机用户名
export function generateRandomUsername() {
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
  }

  const datePrefix = formatDate(new Date())
  const randomSuffix = Math.random().toString().slice(2, 7) // 截取5位随机数
  return `${datePrefix}_${randomSuffix}`
}

// 检查登录参数是否完整
export function checkRegisterParamsComplete(registerDto: RegisterDto) {
  const { phone, email, password } = registerDto
  // 手机注册方式：只需要有手机号即可
  if (phone) return true // 手机号注册可以不传密码，直接通过校验
  // 邮箱注册方式：必须有邮箱和密码
  if (email && password) return true
  // 如果不满足上述任何条件，则参数不完整
  return false
}
