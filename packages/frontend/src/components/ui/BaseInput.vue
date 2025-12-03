<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | number | null;
  type?: 'text' | 'password' | 'email' | 'number' | 'time' | 'datetime-local' | 'color';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  min?: number | string;
  max?: number | string;
  id?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (props.type === 'number') {
    emit('update:modelValue', target.value === '' ? null : Number(target.value));
  } else {
    emit('update:modelValue', target.value);
  }
}
</script>

<template>
  <input
    :id="id"
    :type="type ?? 'text'"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :readonly="readonly"
    :min="min"
    :max="max"
    @input="handleInput"
  />
</template>
