#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = process.cwd()
const templatePath = resolve(repoRoot, '.gitmessage/dao-commit-template.txt')
const hooksPath = resolve(repoRoot, '.githooks')

if (!existsSync(templatePath)) {
  console.error(`未找到提交模板：${templatePath}`)
  process.exit(1)
}

if (!existsSync(hooksPath)) {
  console.error(`未找到 hooks 目录：${hooksPath}`)
  process.exit(1)
}

execFileSync('git', ['config', 'commit.template', templatePath], { stdio: 'inherit' })
execFileSync('git', ['config', 'core.hooksPath', hooksPath], { stdio: 'inherit' })

console.log('\nDao Git 本地配置完成：')
console.log(`- commit.template -> ${templatePath}`)
console.log(`- core.hooksPath -> ${hooksPath}`)
