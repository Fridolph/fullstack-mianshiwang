<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>

        <TemplateMenu />
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
      <slot />
    </UMain>
  </UApp>
</template>
