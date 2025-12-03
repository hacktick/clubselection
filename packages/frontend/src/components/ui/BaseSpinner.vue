<script setup lang="ts">
defineProps<{
  size?: 'small' | 'large';
}>();
</script>

<template>
  <div :data-spinner="size ?? undefined"></div>
</template>
