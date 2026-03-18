/**
 * 导航项组合式函数
 * 提供应用导航菜单结构
 */

// 定义导航项类型
export interface NavItem {
  label: string
  icon: string
  description: string
  to: string
  disabled?: boolean
  badge?: string | number
  isNew?: boolean
  children?: NavItem[]
}

/**
 * 导航菜单项组合式函数
 * @returns 导航菜单项数据
 */
export default function useNavItems() {
  const { t, locale } = useI18n()

  // 基础导航项数据 - 直接使用t()进行翻译
  const baseItems = computed<NavItem[]>(() => {
    // 显式依赖locale以响应语言变化
    const currentLocale = locale.value

    return [
      {
        label: t('nav.nuxt_ui'),
        icon: 'i-lucide-layers',
        description: t('nav.nuxt_comp_desc'),
        to: '/nuxt-ui'
        // children: UI_COMPONENT_CHILDREN
      },
      {
        label: t('nav.demo'),
        icon: 'i-lucide-layers',
        description: t('nav.demo_desc'),
        to: '/demo'
      },
      {
        label: t('nav.idea'),
        icon: 'mdi:head-lightbulb-outline',
        description: t('nav.idea_desc'),
        to: '/idea'
      }
    ]
  })

  // 动态添加的导航项
  const dynamicNavItems = ref<NavItem[]>([])

  // 合并固定项和动态项
  const allItems = computed(() => [...baseItems.value, ...dynamicNavItems.value])

  /**
   * 获取特定路径的导航项
   * @param path 路径
   * @returns 匹配的导航项或undefined
   */
  const getNavItemByPath = (path: string): NavItem | undefined => {
    // 检查顶级导航项
    const topLevelItem = allItems.value.find(item => item.to === path)
    if (topLevelItem) return topLevelItem

    // 检查子导航项
    for (const item of allItems.value) {
      if (item.children) {
        const childItem = item.children.find(child => child.to === path)
        if (childItem) return childItem
      }
    }

    return undefined
  }

  /**
   * 动态添加新的导航项
   */
  const addNavItem = (newItem: NavItem, index?: number): void => {
    if (index !== undefined && index >= 0 && index <= dynamicNavItems.value.length) {
      dynamicNavItems.value.splice(index, 0, newItem)
    } else {
      dynamicNavItems.value.push(newItem)
    }
  }

  /**
   * 更新导航项
   * @param label 要更新的导航项的标签
   * @param updates 要应用的更新
   */
  const updateNavItem = (label: string, updates: Partial<NavItem>): void => {
    // 由于基础导航项现在是计算属性，不能直接更新它们
    // 所以我们只更新动态导航项
    const index = dynamicNavItems.value.findIndex(item => item.label === label)
    if (index !== -1) {
      dynamicNavItems.value[index] = {
        ...dynamicNavItems.value[index],
        ...updates
      } as NavItem
    } else {
      console.warn(`未找到标签为 "${label}" 的导航项，或尝试更新基础导航项，这不被支持`)
    }
  }

  return {
    baseItems,
    items: allItems,
    getNavItemByPath,
    addNavItem,
    updateNavItem
  }
}
