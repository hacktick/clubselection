<script setup lang="ts">
defineProps<{
  bg?: 'glow' | 'light';
  padding?: 'section' | 'none';
}>();
</script>

<template>
  <section
    :data-bg="bg ?? 'glow'"
    :data-padding="padding ?? 'section'"
  >
    <header v-if="$slots.header">
      <slot name="header" />
    </header>
    <slot />
  </section>
</template>
