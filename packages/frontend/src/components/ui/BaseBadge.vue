<script setup lang="ts">
defineProps<{
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  color?: string;
}>();
</script>

<template>
  <mark
    data-badge
    :data-status="status ?? 'neutral'"
    :style="color ? { '--badge-color': color } : undefined"
  >
    <slot />
  </mark>
</template>
