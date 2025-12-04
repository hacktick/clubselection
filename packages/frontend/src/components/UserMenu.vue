<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const isMenuOpen = ref(false);
const buttonRef = ref<HTMLButtonElement | null>(null);
const dropdownStyle = ref({ top: '0px', right: '0px', width: '0px' });

const toggleMenu = async () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value && buttonRef.value) {
    await nextTick();
    const rect = buttonRef.value.getBoundingClientRect();
    // Use clientWidth instead of innerWidth to account for scrollbar
    const viewportWidth = document.documentElement.clientWidth;
    dropdownStyle.value = {
      top: `${rect.bottom}px`,
      right: `${viewportWidth - rect.right}px`,
      width: `${rect.width}px`
    };
  }
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const logout = () => {
  authStore.logout();
  closeMenu();
  router.push('/');
};

const displayName = () => {
  if (authStore.admin) {
    return authStore.admin.username || authStore.admin.name;
  }
  if (authStore.student) {
    return t('student.student');
  }
  return t('auth.guest');
};

const isAuthenticated = () => {
  return authStore.admin || authStore.student;
};
</script>

<template>
  <div v-if="isAuthenticated()" data-user-menu :data-open="isMenuOpen || undefined">
    <button ref="buttonRef" @click="toggleMenu" data-variant="secondary" data-size="small">
      <span data-avatar>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </span>
      <span>{{ displayName() }}</span>
    </button>

    <Teleport to="body">
      <div v-if="isMenuOpen" data-user-menu-backdrop @click="closeMenu"></div>
      <div v-if="isMenuOpen" data-user-menu-dropdown :style="dropdownStyle" @click.stop>
        <button @click="logout">
          {{ t('auth.logout') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
