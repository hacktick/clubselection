<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue';

defineProps<{
  loading?: boolean;
  message?: string;
}>();
</script>

<template>
  <div data-empty>
    <BaseSpinner v-if="loading" size="large" />
    <p>
      <slot>{{ message ?? 'No items found' }}</slot>
    </p>
  </div>
</template>
