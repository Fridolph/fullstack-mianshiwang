<script setup lang="ts">
import useNavItems from '~/composables/layouts/useNavItems'

const { items } = useNavItems()
</script>

<template>
  <UNavigationMenu
    arrow :items="items"
    content-orientation="vertical"
  />
</template>
