<script setup lang="ts">
const items = [
  'https://picsum.photos/640/640?random=1',
  'https://picsum.photos/640/640?random=2',
  'https://picsum.photos/640/640?random=3',
  'https://picsum.photos/640/640?random=4',
  'https://picsum.photos/640/640?random=5',
  'https://picsum.photos/640/640?random=6'
]

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)

function onClickPrev() {
  activeIndex.value--
}
function onClickNext() {
  activeIndex.value++
}
function onSelect(index: number) {
  activeIndex.value = index
}

function select(index: number) {
  activeIndex.value = index

  carousel.value?.emblaApi?.scrollTo(index)
}

const carouselCode = ref(`<template>
  <section>
    <UCarousel
      ref="carousel"
      v-slot="{ item }"
      arrows
      :items="items"
      :prev="{ onClick: onClickPrev }"
      :next="{ onClick: onClickNext }"
      class="w-full max-w-xs mx-auto"
      @select="onSelect">
      <img
        :src="item" width="320" height="320"
        class="rounded-lg">
    </UCarousel>

    <div class="flex gap-1 justify-between pt-4 max-w-xs mx-auto">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="size-11 opacity-25 hover:opacity-100 transition-opacity"
        :class="{ 'opacity-100': activeIndex === index }"
        @click="select(index)">
        <img
          :src="item" width="44" height="44"
          class="rounded-lg">
      </div>
    </div>
  </section>
</template>

${SCRIPT_START}
const items = [
  'https://picsum.photos/640/640?random=1',
  'https://picsum.photos/640/640?random=2',
  'https://picsum.photos/640/640?random=3',
  'https://picsum.photos/640/640?random=4',
  'https://picsum.photos/640/640?random=5',
  'https://picsum.photos/640/640?random=6'
]

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)

function onClickPrev() {
  activeIndex.value--
}
function onClickNext() {
  activeIndex.value++
}
function onSelect(index: number) {
  activeIndex.value = index
}

function select(index: number) {
  activeIndex.value = index

  carousel.value?.emblaApi?.scrollTo(index)
}
${SCRIPT_START}
`)
</script>

<template>
  <div class="flex-1 w-full">
    <ContentsCodeViewer
      title="UCarousel"
      description="可定制相关属性及控制方式"
      :code="carouselCode"
      language="vue">
      <UCarousel
        ref="carousel"
        v-slot="{ item }"
        arrows
        :items="items"
        :prev="{ onClick: onClickPrev }"
        :next="{ onClick: onClickNext }"
        class="w-full max-w-xs mx-auto"
        @select="onSelect">
        <img
          :src="item" width="320" height="320"
          class="rounded-lg">
      </UCarousel>

      <div class="flex gap-1 justify-between pt-4 max-w-xs mx-auto">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="size-11 opacity-25 hover:opacity-100 transition-opacity"
          :class="{ 'opacity-100': activeIndex === index }"
          @click="select(index)">
          <img
            :src="item" width="44" height="44"
            class="rounded-lg">
        </div>
      </div>
    </ContentsCodeViewer>
  </div>
</template>
