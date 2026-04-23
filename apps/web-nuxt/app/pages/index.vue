<script setup lang="ts">
const userStore = useUserStore()
const freshStartPath = '/interview/start?fresh=1'

const serviceCards = [
  {
    title: '简历分析',
    description: '先根据目标岗位和简历内容拿到结构化分析结果，再决定后面的追问与押题方向。',
    icon: 'i-lucide-file-search-2',
    to: freshStartPath,
  },
  {
    title: '简历押题',
    description: '通过流式进度观察 AI 工作过程，逐步理解前后端联调和 SSE 交互链路。',
    icon: 'i-lucide-sparkles',
    to: freshStartPath,
  },
  {
    title: '历史复盘',
    description: '查看消费记录和服务轨迹，后续会继续补结果详情与完整报告回看。',
    icon: 'i-lucide-history',
    to: '/history',
  },
]

const learnCards = [
  {
    title: '迁移记录',
    description: '查看 JS -> TS -> Monorepo 的阶段演进、踩坑和取舍。',
    icon: 'i-lucide-book-open-text',
    to: '/migration-notes',
  },
  {
    title: '个人中心',
    description: '查看当前用户资料、剩余次数和后续将继续补齐的个人能力面板。',
    icon: 'i-lucide-user-round',
    to: '/profile',
  },
]

const startPath = computed(() =>
  userStore.isLogin ? freshStartPath : `/login?redirect=${encodeURIComponent(freshStartPath)}`,
)
</script>

<template>
  <section class="home-page">
    <UCard
      class="home-hero"
      :ui="{
        body: 'p-0 sm:p-0'
      }">
      <div class="home-hero__body">
        <UBadge color="primary" variant="soft" size="lg">
          AI 面试练习平台
        </UBadge>

        <div class="home-hero__copy">
          <h1 class="section-title">
            从简历分析开始，进入你的 AI 面试训练入口
          </h1>
          <p class="section-description">
            现在首页先回归“用户真正要做什么”：登录、开始简历分析、发起简历押题、查看历史记录。
            原来的迁移说明仍然保留，但挪到独立入口，方便学习和复盘。
          </p>
        </div>

        <div class="home-hero__actions">
          <UButton size="xl" icon="i-lucide-play" :to="startPath">
            {{ userStore.isLogin ? '开始 AI 面试' : '登录后开始 AI 面试' }}
          </UButton>
          <UButton
            size="xl"
            color="neutral"
            variant="soft"
            icon="i-lucide-history"
            to="/history">
            查看历史记录
          </UButton>
          <UButton
            size="xl"
            color="neutral"
            variant="ghost"
            icon="i-lucide-book-open-text"
            to="/migration-notes">
            查看迁移说明
          </UButton>
        </div>

        <div class="home-hero__stats">
          <UCard
            v-for="item in [
              { label: '当前重点', value: '简历分析 + 押题主链路' },
              { label: '前端状态', value: 'Nuxt UI + 用户认证已接入' },
              { label: '后续节奏', value: '继续补齐 ww-server 真实能力' }
            ]"
            :key="item.label"
            variant="subtle"
            class="home-stat">
            <p class="home-stat__label">
              {{ item.label }}
            </p>
            <p class="home-stat__value">
              {{ item.value }}
            </p>
          </UCard>
        </div>
      </div>
    </UCard>

    <section class="home-section">
      <div class="home-section__header">
        <div>
          <UBadge color="neutral" variant="soft">
            业务入口
          </UBadge>
          <h2 class="home-section__title">
            先做真正会用到的事情
          </h2>
        </div>
      </div>

      <div class="home-grid">
        <UCard
          v-for="card in serviceCards"
          :key="card.title"
          class="home-card">
          <template #header>
            <div class="home-card__header">
              <UIcon :name="card.icon" class="size-6 text-primary" />
              <h3>{{ card.title }}</h3>
            </div>
          </template>

          <p class="home-card__description">
            {{ card.description }}
          </p>

          <template #footer>
            <UButton
              color="primary"
              variant="soft"
              block
              trailing-icon="i-lucide-arrow-right"
              :to="card.to">
              进入
            </UButton>
          </template>
        </UCard>
      </div>
    </section>

    <section class="home-section">
      <div class="home-section__header">
        <div>
          <UBadge color="neutral" variant="soft">
            学习入口
          </UBadge>
          <h2 class="home-section__title">
            保留迁移记录，但不再占据首页主入口
          </h2>
        </div>
      </div>

      <div class="home-grid home-grid--compact">
        <UCard
          v-for="card in learnCards"
          :key="card.title"
          class="home-card">
          <template #header>
            <div class="home-card__header">
              <UIcon :name="card.icon" class="size-6 text-primary" />
              <h3>{{ card.title }}</h3>
            </div>
          </template>

          <p class="home-card__description">
            {{ card.description }}
          </p>

          <template #footer>
            <UButton
              color="neutral"
              variant="soft"
              block
              trailing-icon="i-lucide-arrow-right"
              :to="card.to">
              打开
            </UButton>
          </template>
        </UCard>
      </div>
    </section>
  </section>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 24px;
}

.home-hero {
  overflow: hidden;
}

.home-hero__body {
  padding: clamp(28px, 5vw, 56px);
  background:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.16), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.82));
}

.home-hero__copy {
  margin-top: 20px;
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.home-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}

.home-stat__label,
.home-stat__value {
  margin: 0;
}

.home-stat__label {
  color: var(--app-muted);
  font-size: 13px;
}

.home-stat__value {
  margin-top: 8px;
  font-weight: 700;
  line-height: 1.6;
}

.home-section {
  display: grid;
  gap: 16px;
}

.home-section__title {
  margin: 12px 0 0;
  font-size: clamp(22px, 4vw, 30px);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.home-grid--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-card__header h3 {
  margin: 0;
  font-size: 20px;
}

.home-card__description {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.8;
}

@media (max-width: 960px) {
  .home-hero__stats,
  .home-grid,
  .home-grid--compact {
    grid-template-columns: 1fr;
  }
}
</style>
