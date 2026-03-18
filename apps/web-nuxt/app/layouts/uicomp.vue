<script setup lang="ts">
withDefaults(defineProps<{
  layoutClass?: string
  useLog?: boolean
}>(), {
  useLog: false
})
const router = useRouter()
const back = () => {
  router.back()
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>

        <!-- <TemplateMenu /> -->

        <UButton
          variant="outline" size="xs"
          class="text-xs cursor-pointer translate-y-0.5 ml-1"
          @click="back">
          <UIcon name="mdi:arrow-left" class="size-4" />
          Prev
        </UButton>
      </template>

      <HeaderNav />

      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/nuxt-ui-templates/starter"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
        <FormsLangSelector />
      </template>
    </UHeader>

    <UMain class="p-4">
      <section class="flex flex-col gap-4">
        <div class="gap-6" :class="useLog ? 'grid grid-cols-3' : 'flex flex-col'">
          <div :class="[layoutClass, useLog ? 'col-span-2' : '']">
            <slot />
          </div>
          <InteractionLog v-if="useLog" class="self-start" />
        </div>
      </section>
    </UMain>
  </UApp>
</template>
