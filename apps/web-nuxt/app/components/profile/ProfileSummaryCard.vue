<script setup lang="ts">
defineProps<{
  email?: string
  username?: string
  nickname?: string
  wwCoinBalance?: number
  resumeRemainingCount?: number
  specialRemainingCount?: number
  behaviorRemainingCount?: number
}>()
</script>

<template>
  <section class="profile-summary surface-card">
    <div class="profile-summary__top">
      <div class="profile-summary__avatar">
        <UIcon name="i-lucide-user-round" class="size-8" />
      </div>
      <div>
        <p class="profile-summary__name">
          {{ nickname || username || '未设置用户名' }}
        </p>
        <p class="profile-summary__email">
          {{ email || '暂无邮箱信息' }}
        </p>
      </div>
    </div>

    <div class="profile-summary__wallet">
      <p>旺旺币余额</p>
      <strong>{{ wwCoinBalance ?? 0 }}</strong>
    </div>

    <div class="profile-summary__stats">
      <article>
        <span>简历押题</span>
        <strong>{{ resumeRemainingCount ?? 0 }}</strong>
      </article>
      <article>
        <span>专项面试</span>
        <strong>{{ specialRemainingCount ?? 0 }}</strong>
      </article>
      <article>
        <span>HR / 行测</span>
        <strong>{{ behaviorRemainingCount ?? 0 }}</strong>
      </article>
    </div>
  </section>
</template>

<style scoped>
.profile-summary {
  padding: 24px;
}

.profile-summary__top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-summary__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  color: var(--app-primary);
  background: var(--app-primary-soft);
}

.profile-summary__name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.profile-summary__email {
  margin: 6px 0 0;
  color: var(--app-muted);
}

.profile-summary__wallet {
  margin-top: 20px;
  padding: 18px;
  border-radius: 20px;
  color: white;
  background: linear-gradient(135deg, #0f766e, #047857);
}

.profile-summary__wallet p,
.profile-summary__wallet strong {
  margin: 0;
}

.profile-summary__wallet strong {
  display: block;
  margin-top: 10px;
  font-size: 34px;
}

.profile-summary__stats {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.profile-summary__stats article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
}

.profile-summary__stats span {
  color: var(--app-muted);
}

.profile-summary__stats strong {
  font-size: 20px;
}
</style>
