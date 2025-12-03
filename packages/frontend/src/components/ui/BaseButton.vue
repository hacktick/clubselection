<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'tag';
  size?: 'small' | 'medium';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  active?: boolean;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    :data-variant="variant ?? 'primary'"
    :data-size="size === 'small' ? 'small' : undefined"
    :data-active="active ? '' : undefined"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" data-spinner></span>
    <slot v-else />
  </button>
</template>
