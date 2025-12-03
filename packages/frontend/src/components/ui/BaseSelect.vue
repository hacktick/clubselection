<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

export interface SelectOption {
  value: string | number;
  label: string;
}

const props = defineProps<{
  modelValue?: string | number | null;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
}>();

const isOpen = ref(false);
const selectRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const dropdownId = `select-dropdown-${Math.random().toString(36).substr(2, 9)}`;
const dropdownStyle = ref<{ top: string; left: string; width: string }>({
  top: '0px',
  left: '0px',
  width: '150px',
});

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue);
});

const displayText = computed(() => {
  return selectedOption.value?.label ?? props.placeholder ?? 'Select...';
});

function updateDropdownPosition() {
  if (!triggerRef.value) return;

  const rect = triggerRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
}

function toggle() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      nextTick(() => {
        updateDropdownPosition();
      });
    }
  }
}

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value);
  isOpen.value = false;
}

function handleMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // Check if click is on trigger or dropdown using data attributes
  const clickedTrigger = selectRef.value?.contains(target);
  const clickedDropdown = target.closest(`[data-select-dropdown-id="${dropdownId}"]`);

  if (!clickedTrigger && !clickedDropdown) {
    isOpen.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false;
  }
}

function handleScroll() {
  if (isOpen.value) {
    updateDropdownPosition();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', updateDropdownPosition);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', updateDropdownPosition);
});

watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      updateDropdownPosition();
    });
  }
});
</script>

<template>
  <div
    ref="selectRef"
    data-select
    :data-open="isOpen || undefined"
    :data-disabled="disabled || undefined"
    :id="id"
  >
    <button
      ref="triggerRef"
      type="button"
      data-select-trigger
      @click="toggle"
      :disabled="disabled"
    >
      <span :data-placeholder="!selectedOption || undefined">{{ displayText }}</span>
      <svg data-select-arrow viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    <Teleport to="body">
      <div
        v-if="isOpen"
        data-select-dropdown
        :data-select-dropdown-id="dropdownId"
        :style="dropdownStyle"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          data-select-option
          :data-selected="option.value === modelValue || undefined"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
