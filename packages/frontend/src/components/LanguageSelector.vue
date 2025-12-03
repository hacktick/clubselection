<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { availableLocales, setLocale, getCurrentLocale, type SupportedLocale } from '../i18n';

const isOpen = ref(false);
const currentLocale = ref(getCurrentLocale());
const buttonRef = ref<HTMLButtonElement | null>(null);
const dropdownStyle = ref({ top: '0px', left: '0px' });

const currentLanguage = computed(() => {
  return availableLocales.find(l => l.code === currentLocale.value)?.name ?? 'English';
});

const updateDropdownPosition = () => {
  if (buttonRef.value) {
    const rect = buttonRef.value.getBoundingClientRect();
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.right - 120}px` // 120px = min-width of dropdown, align right edge
    };
  }
};

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    await nextTick();
    updateDropdownPosition();
  }
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectLanguage = (locale: SupportedLocale) => {
  setLocale(locale);
  currentLocale.value = locale;
  closeDropdown();
};
</script>

<template>
  <div data-language-selector>
    <button
      ref="buttonRef"
      @click="toggleDropdown"
      data-variant="ghost"
      data-size="small"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
      <span>{{ currentLanguage }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12" data-chevron>
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" data-language-backdrop @click="closeDropdown"></div>
      <div v-if="isOpen" data-language-dropdown :style="dropdownStyle">
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          @click="selectLanguage(locale.code)"
          :data-selected="locale.code === currentLocale || undefined"
        >
          {{ locale.name }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
