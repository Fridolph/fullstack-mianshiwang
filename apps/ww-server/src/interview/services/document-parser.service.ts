import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import * as pdfParser from 'pdf-parse'
import * as mammoth from 'mammoth'
import WordExtractor from 'word-extractor'

/**
 * 文档解析服务
 * 支持从 URL 下载并解析 PDF、DOCX 等格式的简历文件
 */
@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name)
  // 支持文件类型 pdf word
  private readonly SUPPORTED_TYPES = {
    PDF: ['.pdf'],
    DOCX: ['.docx'],
    DOC: ['.doc'],
    MARKDOWN: ['.md'],
  }
  // 最大文件大小 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024

  async parseDocumentFromUrl(url: string) {
    try {
      this.logger.log(`开始解析文档: ${url}`)
      // 1 验证URL
      this.validateUrl(url)
      // 2 下载文件
      const buffer = await this.downloadFile(url)
      // 3. 根据文件类型解析
      const text = await this.parseBufferByFileName(url, buffer)
      this.logger.log(`文档解析成功: 长度 ${text.length} 个字符`)
      return text
    } catch (error) {
      this.logger.log(`文档解析失败: ${error.message}`, error.stack)
      throw error
    }
  }

  async parseDocumentFromUpload(fileName: string, buffer: Buffer) {
    if (!fileName) {
      throw new BadRequestException('文件名不能为空')
    }

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('上传文件为空')
    }

    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new BadRequestException('文件过大，当前最多支持 10MB')
    }

    const text = await this.parseBufferByFileName(fileName, buffer)
    this.logger.log(`上传文档解析成功: ${fileName}, 长度=${text.length}`)
    return text
  }

  private validateUrl(url: string) {
    if (!url) throw new BadRequestException('url 地址不能为空')
    try {
      new URL(url)
    } catch {
      throw new BadRequestException('url 格式不正确')
    }
    // 检查文件扩展名
    const fileType = this.getFileType(url)
    if (!fileType) {
      throw new BadRequestException(
        `不支持的文件格式, 当前仅支持 ${Object.values(this.SUPPORTED_TYPES).flat().join(', ')}`,
      )
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(url: string): 'PDF' | 'DOCX' | 'DOC' | 'MARKDOWN' | null {
    const urlLower = url.toLowerCase()
    for (const [type, extensions] of Object.entries(this.SUPPORTED_TYPES)) {
      for (const ext of extensions) {
        if (urlLower.endsWith(ext) || urlLower.includes(`${ext}?`)) {
          return type as 'PDF' | 'DOCX' | 'DOC' | 'MARKDOWN'
        }
      }
    }
    return null
  }

  private async parseBufferByFileName(fileName: string, buffer: Buffer) {
    const fileType = this.getFileType(fileName)

    switch (fileType) {
      case 'PDF':
        return this.parsePdf(buffer)
      case 'DOCX':
        return this.parseDocx(buffer)
      case 'DOC':
        return this.parseDoc(buffer)
      case 'MARKDOWN':
        return this.parseMarkdown(buffer)
      default:
        throw new BadRequestException(
          '不支持的文件格式，当前仅支持 pdf、doc、docx、md',
        )
    }
  }

  /**
   * 下载文件
   */
  private async downloadFile(url: string) {
    try {
      this.logger.log(`开始下载文件 ${url}`)

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: this.MAX_FILE_SIZE,
        maxBodyLength: this.MAX_FILE_SIZE,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ResumeParser/1.0)',
        },
      })

      const buffer = Buffer.from(response.data)
      // 验证文件大小
      if (buffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestException(
          `文件过大 (${(buffer.length / 1024 / 1024).toFixed(2)}MB, 最大支持10MB)`,
        )
      }
      // 验证内容不为空
      if (buffer.length === 0) {
        throw new BadRequestException('当前文件为空')
      }
      this.logger.log(
        `文件下载成功, 大小 ${(buffer.length / 1024).toFixed(2)}KB`,
      )

      return buffer
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      if (error.code === 'ECONNABORTED') {
        throw new BadRequestException('文件下载超时，请检查网络或文件地址')
      }
      if (error.response?.status === 404) {
        throw new BadRequestException('文件不存在或已被删除')
      }
      if (error.response?.status === 403) {
        throw new BadRequestException('无权访问该文件，请检查文件权限')
      }
      throw new BadRequestException(
        `文件下载失败: ${error.message || '未知错误'} `,
      )
    }
  }

  /**
   * 解析PDF文件
   */
  private async parsePdf(buffer: Buffer) {
    try {
      this.logger.log('开始解析PDF文件')

      const data = await pdfParser.default(buffer)
      if (!data.text || data.text.trim().length === 0) {
        throw new BadRequestException(
          'PDF 文件无法提取文本内容。可能原因：' +
            ' \n 1. PDF 是图片格式（需要 OCR）' +
            ' \n 2. PDF 已加密或受保护' +
            ' \n 3. PDF 文件损坏',
        )
      }
      this.logger.log(
        `PDF 解析成功: 页数= ${data.numpages} , 长度= ${data.text.length} `,
      )
      return data.text
    } catch (err) {
      if (err instanceof BadRequestException) throw err

      this.logger.error(`PDF解析失败，${err.message}`, err.stack)
      throw new BadRequestException(
        `PDF 文件解析失败: ${err.message}, 请确保文件未加密且未损坏`,
      )
    }
  }

  /**
   * 解析 DOCX 文档内容
   */
  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      // 记录解析开始的日志
      this.logger.log('开始解析 DOCX 文件')

      // 使用 `mammoth` 库提取 DOCX 文件中的纯文本内容
      const result = await mammoth.extractRawText({ buffer })

      // 如果解析结果为空或者没有提取到任何有效文本，抛出 BadRequestException
      if (!result.value || result.value.trim().length === 0) {
        throw new BadRequestException(
          'DOCX 文件无法提取文本内容。可能原因：' +
            ' \n 1. 文件为空' +
            ' \n 2. 文件格式不正确' +
            ' \n 3. 文件已损坏',
        )
      }

      // 如果解析过程中有任何警告信息，记录这些警告
      if (result.messages && result.messages.length > 0) {
        this.logger.warn(
          `DOCX 解析警告: ${result.messages.map((m) => m.message).join(', ')} `,
        )
      }

      // 记录解析成功的日志，并附上提取文本的长度
      this.logger.log(`DOCX 解析成功: 长度= ${result.value.length} `)

      // 返回提取的文本内容
      return result.value
    } catch (error) {
      // 如果是已知的 BadRequestException 错误，直接抛出
      if (error instanceof BadRequestException) {
        throw error
      }

      // 其他错误记录详细日志并抛出通用错误提示
      this.logger.error(`DOCX 解析失败: ${error.message} `, error.stack)
      throw new BadRequestException(
        `DOCX 文件解析失败: ${error.message} 。请确保文件格式正确且未损坏`,
      )
    }
  }

  private async parseDoc(buffer: Buffer): Promise<string> {
    try {
      this.logger.log('开始解析 DOC 文件')
      const extractor = new WordExtractor()
      const document = await extractor.extract(buffer)
      const text = document.getBody()

      if (!text || text.trim().length === 0) {
        throw new BadRequestException(
          'DOC 文件无法提取文本内容，请确认文件未损坏且内容可读取',
        )
      }

      this.logger.log(`DOC 解析成功: 长度=${text.length}`)
      return text
    } catch (error) {
      if (error instanceof BadRequestException) throw error

      this.logger.error(`DOC 解析失败: ${error.message}`, error.stack)
      throw new BadRequestException(
        `DOC 文件解析失败: ${error.message || '未知错误'}，请确认文件格式正确`,
      )
    }
  }

  private parseMarkdown(buffer: Buffer) {
    this.logger.log('开始解析 Markdown 文件')
    const text = buffer.toString('utf-8')

    if (!text.trim()) {
      throw new BadRequestException('Markdown 文件内容为空')
    }

    return text
  }

  /**
   * 清理文本内容，trim 处理特殊字符等
   */
  cleanText(text: string) {
    if (!text) return ''

    return (
      text
        // 1. 统一换行符
        .replace(/\r\n/g, ' \n ')
        .replace(/\r/g, ' \n ')
        // 去除文字中间的多余空格
        .replace(/\s+/g, '')

        // 2. 去除多余的空行（保留最多2个连续换行）
        .replace(/\n{3,}/g, ' \n \n ')

        // 3. 去除行首行尾空白
        .split(' \n ')
        .map((line) => line.trim())
        .join(' \n ')

        // 4. 去除特殊的 Unicode 控制字符
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

        // 5. 统一空格（去除多余空格）
        .replace(/ {2,}/g, ' ')

        // 6. 去除页眉页脚常见标记
        .replace(/第\s*\d+\s*页/g, '')
        .replace(/Page\s+\d+/gi, '')

        // 7. 整体 trim
        .trim()
    )
  }

  /**
   * 预估 Token 数量（粗略估算）
   * 中文：约 1.5-2 字符 = 1 token
   * 英文：约 4 字符 = 1 token
   */
  estimateTokens(text: string): number {
    if (!text) {
      return 0
    }

    // 统计中文字符数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length

    // 统计英文单词数（粗略）
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length

    // 其他字符
    const otherChars = text.length - chineseChars

    // 预估 token
    const chineseTokens = chineseChars / 1.5 // 中文字符
    const englishTokens = englishWords // 英文单词
    const otherTokens = otherChars / 4 // 其他字符

    return Math.ceil(chineseTokens + englishTokens + otherTokens)
  }

  /**
   * 验证文本内容质量：检查文本是否符合简历的基本特征
   */
  validateResumeContent(text: string): {
    isValid: boolean
    reason?: string
    warnings?: string[] | undefined
  } {
    const warnings: string[] = []
    // 1. 长度检查
    if (text.length < 100) {
      return {
        isValid: false,
        reason: '简历内容过短（少于200个字符），可能解析不完整',
      }
    }
    if (text.length > 20000) {
      warnings.push(`简历内容较长 (${text.length}个字符)，可能影响后续处理速度`)
    }
    // 2. 关键信息检查（至少包含部分常见简历关键词）
    const resumeKeywords = [
      // 个人信息
      '姓名',
      '性别',
      '年龄',
      '手机',
      '电话',
      '邮箱',
      'email',
      '微信',
      // 教育经历
      '教育',
      '学历',
      '毕业',
      '大学',
      '学院',
      '专业',
      // 工作经历
      '工作',
      '经验',
      '项目',
      '公司',
      '职位',
      '岗位',
      // 技能
      '技能',
      '能力',
      '掌握',
      '熟悉',
      '精通',
    ]

    const foundKeywords = resumeKeywords.filter((keyword) =>
      text.includes(keyword),
    )
    if (foundKeywords.length < 3) {
      warnings.push(
        '简历内容可能不完整，缺少基本信息、关键信息等，如：姓名、年龄、教育经历，工作经历，个人履历等',
      )
    }
    // 3. 格式检查
    const lines = text.split('\n').filter((line) => line.trim().length > 0)
    if (lines.length < 10) {
      warnings.push('简历格式可能有问题，内容行数过少')
    }
    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }
}
