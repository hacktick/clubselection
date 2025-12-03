<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView } from 'vue-router';
import LanguageSelector from './components/LanguageSelector.vue';
import UserMenu from './components/UserMenu.vue';
import AppFooter from './components/AppFooter.vue';
import { api } from './services/api';

const siteTitle = ref('Club Selection Management');

async function fetchSiteTitle() {
  try {
    const response = await api.get('/api/settings/site_title');
    const data = await response.json();

    if (response.ok && data.setting) {
      siteTitle.value = data.setting.value;
    }
  } catch (error) {
    console.error('Error fetching site title:', error);
  }
}

onMounted(() => {
  fetchSiteTitle();

  window.addEventListener('settings-updated', (event: any) => {
    if (event.detail.key === 'site_title') {
      siteTitle.value = event.detail.value;
    }
  });
});
</script>

<template>
  <div id="app">
    <header>
      <h1>{{ siteTitle }}</h1>
      <nav>
        <LanguageSelector />
        <UserMenu />
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
