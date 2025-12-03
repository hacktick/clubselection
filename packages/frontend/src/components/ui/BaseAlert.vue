<script setup lang="ts">
defineProps<{
  type?: 'error' | 'success' | 'warning' | 'info';
}>();
</script>

<template>
  <div :data-alert="type ?? 'info'">
    <slot />
  </div>
</template>
