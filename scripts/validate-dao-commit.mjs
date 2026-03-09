#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const ALLOWED_TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'style']
const DAO_HEADER_RE = new RegExp(
  String.raw`^\[[^\[\]]{2}\]\[[^\[\]]+\] ` +
    String.raw`(?<type>feat|fix|refactor|docs|test|chore|style)` +
    String.raw`(?:\((?<scope>[^()]+)\))?` +
    String.raw`: (?<subject>\S.+)$`,
)
const BYPASS_PREFIXES = ['Merge ', 'Revert ', 'fixup! ', 'squash! ']

function firstMeaningfulLine(text) {
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#'))
      continue
    return line
  }
  return ''
}

function validateHeader(header) {
  if (!header) {
    return {
      valid: false,
      error: '提交信息为空，至少需要一行 header。',
    }
  }

  if (BYPASS_PREFIXES.some(prefix => header.startsWith(prefix)))
    return { valid: true, error: '' }

  const match = header.match(DAO_HEADER_RE)
  if (!match) {
    return {
      valid: false,
      error: [
        'Dao Commit header 不符合规范。',
        '期望格式：`[上卦下卦][卦名] type(scope): 简短描述`',
        `允许的 type：${ALLOWED_TYPES.join(' | ')}`,
        `实际 header：${header}`,
      ].join('\n'),
    }
  }

  const subject = match.groups?.subject?.trim() ?? ''
  if (!subject) {
    return {
      valid: false,
      error: 'subject 不能为空。',
    }
  }

  return { valid: true, error: '' }
}

function main() {
  const [, , messageFile] = process.argv
  if (!messageFile) {
    console.error('用法：validate-dao-commit.mjs <commit-message-file>')
    process.exit(2)
  }

  if (!existsSync(messageFile)) {
    console.error(`未找到提交信息文件：${messageFile}`)
    process.exit(2)
  }

  const text = readFileSync(messageFile, 'utf8')
  const header = firstMeaningfulLine(text)
  const result = validateHeader(header)

  if (!result.valid) {
    console.error(result.error)
    process.exit(1)
  }
}

main()
