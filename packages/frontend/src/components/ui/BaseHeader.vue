<script setup lang="ts">
import { useRouter } from 'vue-router';
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  title?: string;
  backTo?: string;
  backLabel?: string;
}>();

const router = useRouter();

function handleBack() {
  if (props.backTo) {
    router.push(props.backTo);
  } else {
    router.back();
  }
}
</script>

<template>
  <section data-bg="glow" data-padding="section">
    <header data-page-header>
      <div data-header-left>
        <BaseButton
          v-if="backTo !== undefined"
          @click="handleBack"
          variant="secondary"
          size="small"
        >
          ← {{ backLabel || 'Back' }}
        </BaseButton>
        <h1 v-if="title">{{ title }}</h1>
        <slot name="title" />
      </div>
      <div v-if="$slots.actions" data-header-actions>
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
