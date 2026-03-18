// packages/playground/types/shims-auto-imports.d.ts
import type { Ref } from 'vue'

declare const ref: typeof import('vue')['ref']
declare const reactive: typeof import('vue')['reactive']
declare const computed: typeof import('vue')['computed']
declare const watch: typeof import('vue')['watch']
declare const onMounted: typeof import('vue')['onMounted']
declare const useState: typeof import('#app')['useState']
