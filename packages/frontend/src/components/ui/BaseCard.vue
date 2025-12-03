<script setup lang="ts">
defineProps<{
  title?: string;
  light?: boolean;
}>();
</script>

<template>
  <article :data-light="light ? '' : undefined" data-card>
    <header v-if="title || $slots.titleActions" data-card-header>
      <h3 v-if="title">{{ title }}</h3>
      <div v-if="$slots.titleActions" data-card-title-actions>
        <slot name="titleActions" />
      </div>
    </header>
    <div v-if="$slots.default" data-card-content>
      <slot />
    </div>
    <hr v-if="$slots.default && $slots.actions" data-card-divider />
    <footer v-if="$slots.actions" data-card-actions>
      <slot name="actions" />
    </footer>
  </article>
</template>
