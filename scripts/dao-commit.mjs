#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'

const TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'style']
const PRESETS = [
  { slug: 'user-connection', label: '[☱☷][萃]', hexagram: '萃', upper: '☱', lower: '☷', suggestedType: 'feat', description: '用户层开启连接出口，聚集开始' },
  { slug: 'project-init', label: '[☳☷][复]', hexagram: '复', upper: '☳', lower: '☷', suggestedType: 'chore', description: '基础层启动，重新开始' },
  { slug: 'milestone-complete', label: '[☱☰][夬]', hexagram: '夬', upper: '☱', lower: '☰', suggestedType: 'feat', description: '核心层决断突破，完成交付' },
  { slug: 'major-capability', label: '[☰☲][大有]', hexagram: '大有', upper: '☰', lower: '☲', suggestedType: 'feat', description: '重大能力完成，成果丰硕' },
  { slug: 'core-backbone', label: '[☳☰][大壮]', hexagram: '大壮', upper: '☳', lower: '☰', suggestedType: 'feat', description: '核心主干成型，力量强盛' },
  { slug: 'connection-risk-fix', label: '[☵☱][困]', hexagram: '困', upper: '☵', lower: '☱', suggestedType: 'fix', description: '连接层遇险，谨慎修复' },
  { slug: 'multi-layer-fix', label: '[☶☵][蹇]', hexagram: '蹇', upper: '☶', lower: '☵', suggestedType: 'fix', description: '多层依赖疑难修复，重建边界' },
  { slug: 'risk-resolved', label: '[☲☵][既济]', hexagram: '既济', upper: '☲', lower: '☵', suggestedType: 'fix', description: '风险已渡过，修复完成' },
  { slug: 'high-risk-fix', label: '[☵☵][坎]', hexagram: '坎', upper: '☵', lower: '☵', suggestedType: 'fix', description: '高风险区域修复，步步为营' },
  { slug: 'architecture-upgrade', label: '[☰☶][大畜]', hexagram: '大畜', upper: '☰', lower: '☶', suggestedType: 'refactor', description: '在稳定边界内积蓄架构力量' },
  { slug: 'global-penetration', label: '[☴☴][巽]', hexagram: '巽', upper: '☴', lower: '☴', suggestedType: 'refactor', description: '全局渗透式重构或工具链对齐' },
  { slug: 'remove-redundancy', label: '[☶☱][损]', hexagram: '损', upper: '☶', lower: '☱', suggestedType: 'refactor', description: '减去冗余，留下本质' },
  { slug: 'style-polish', label: '[☲☶][贲]', hexagram: '贲', upper: '☲', lower: '☶', suggestedType: 'style', description: '在稳定基础上整理风格与可读性' },
  { slug: 'stable-boundary', label: '[☶☶][艮]', hexagram: '艮', upper: '☶', lower: '☶', suggestedType: 'chore', description: '锁定边界，稳住入口或配置' },
  { slug: 'infrastructure-support', label: '[☷☷][坤]', hexagram: '坤', upper: '☷', lower: '☷', suggestedType: 'chore', description: '基础设施或承载层维护' },
  { slug: 'knowledge-record', label: '[☲☷][明夷]', hexagram: '明夷', upper: '☲', lower: '☷', suggestedType: 'docs', description: '把隐性共识照亮为记录' },
]

function parseArgs(argv) {
  const args = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      args._.push(token)
      continue
    }

    const key = token.slice(2)
    if (['interactive', 'list', 'help'].includes(key)) {
      args[key] = true
      continue
    }

    const next = argv[index + 1]
    args[key] = next
    index += 1
  }
  return args
}

function printHelp() {
  console.log(`Dao Commit helper

用法：
  node scripts/dao-commit.mjs --interactive
  node scripts/dao-commit.mjs --preset knowledge-record --scope dao-commit --subject "补充接入文档"
  node scripts/dao-commit.mjs --list

常用参数：
  --preset <slug>        使用 16 个常用复卦预设
  --type <type>          feat | fix | refactor | docs | test | chore | style
  --scope <scope>        可选 scope
  --subject <subject>    必填，简短描述
  --background <text>    可选背景
  --pitfall <text>       可选踩坑记录
  --related <text>       可选关联经验，多条可用 " | " 分隔
  --sediment <text>      可选 #沉淀 行，完整写入标题和路径
  --write <file>         将结果写入文件
  --list                 列出 16 个常用复卦预设
  --interactive          进入交互模式
`)
}

function printPresets() {
  console.log('16 个常用复卦预设：')
  PRESETS.forEach((preset, index) => {
    console.log(`${String(index + 1).padStart(2, '0')}. ${preset.slug} ${preset.label} ${preset.suggestedType} - ${preset.description}`)
  })
}

function presetBySlug(slug) {
  return PRESETS.find(preset => preset.slug === slug)
}

function renderMessage({ preset, type, scope, subject, background, pitfall, related, sediment }) {
  const scopeText = scope ? `(${scope})` : ''
  const lines = [`${preset.label} ${type}${scopeText}: ${subject}`]

  if (background) {
    lines.push('', '背景：', background)
  }
  if (pitfall) {
    lines.push('', '踩坑记录：', pitfall)
  }
  if (related) {
    const relatedLines = related.split(' | ').map(item => item.trim()).filter(Boolean)
    lines.push('', '关联经验：', ...relatedLines.map(item => `- ${item}`))
  }
  if (sediment) {
    lines.push('', `#沉淀 ${sediment}`)
  }

  return `${lines.join('\n')}\n`
}

async function ask(question, fallback = '') {
  const rl = createInterface({ input, output })
  try {
    const suffix = fallback ? ` (${fallback})` : ''
    const answer = await rl.question(`${question}${suffix}: `)
    return answer.trim() || fallback
  }
  finally {
    rl.close()
  }
}

async function runInteractive() {
  printPresets()
  const chosen = await ask('选择预设编号或 slug', '16')
  const preset = PRESETS[Number(chosen) - 1] || presetBySlug(chosen)
  if (!preset) {
    console.error(`未找到预设：${chosen}`)
    process.exit(1)
  }

  const type = await ask('选择 type', preset.suggestedType)
  if (!TYPES.includes(type)) {
    console.error(`不支持的 type：${type}`)
    process.exit(1)
  }

  const scope = await ask('输入 scope（可留空）', '')
  const subject = await ask('输入 subject')
  if (!subject) {
    console.error('subject 不能为空')
    process.exit(1)
  }

  const background = await ask('输入背景（可留空）', '')
  const pitfall = await ask('输入踩坑记录（可留空）', '')
  const related = await ask('输入关联经验（多条用 | 分隔，可留空）', '')
  const sediment = await ask('输入 #沉淀（标题 -> 路径，可留空）', '')

  const message = renderMessage({ preset, type, scope, subject, background, pitfall, related, sediment })
  console.log('\n--- Dao Commit Draft ---\n')
  console.log(message)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }
  if (args.list) {
    printPresets()
    return
  }

  const wantsInteractive = args.interactive || process.stdin.isTTY
  if (!args.preset && wantsInteractive) {
    await runInteractive()
    return
  }

  if (!args.preset) {
    console.error('非交互模式下必须提供 --preset')
    process.exit(1)
  }

  const preset = presetBySlug(args.preset)
  if (!preset) {
    console.error(`未找到预设：${args.preset}`)
    process.exit(1)
  }

  const type = args.type || preset.suggestedType
  if (!TYPES.includes(type)) {
    console.error(`不支持的 type：${type}`)
    process.exit(1)
  }

  const subject = args.subject?.trim()
  if (!subject) {
    console.error('必须提供 --subject')
    process.exit(1)
  }

  const message = renderMessage({
    preset,
    type,
    scope: args.scope || '',
    subject,
    background: args.background || '',
    pitfall: args.pitfall || '',
    related: args.related || '',
    sediment: args.sediment || '',
  })

  if (args.write) {
    writeFileSync(args.write, message, 'utf8')
  }

  console.log(message)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
