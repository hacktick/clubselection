<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title?: string;
  large?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function close() {
  emit('update:modelValue', false);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" data-overlay @click="close">
      <article @click.stop :data-modal-large="large ? '' : undefined">
        <header v-if="title || $slots.header">
          <slot name="header">
            <h3>{{ title }}</h3>
          </slot>
          <button data-close @click="close">×</button>
        </header>
        <slot />
        <footer v-if="$slots.footer">
          <slot name="footer" />
        </footer>
      </article>
    </div>
  </Teleport>
</template>
