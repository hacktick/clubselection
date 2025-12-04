<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseCard } from '@/components/ui';

const { t } = useI18n();
const currentYear = new Date().getFullYear();
const showLicense = ref(false);
</script>

<template>
  <footer data-app-footer>
    <div data-footer-content>
      <span>&copy; {{ currentYear }} Club Selection</span>
      <nav>
        <a href="https://github.com/hacktick/clubselection" target="_blank" rel="noopener noreferrer">{{ t('footer.sourceCode') }}</a>
        <a href="/api/docs" target="_blank" rel="noopener noreferrer">{{ t('footer.apiDocs') }}</a>
        <a href="#" @click.prevent="showLicense = true">{{ t('footer.license') }}</a>
      </nav>
    </div>
  </footer>

  <Teleport to="body">
    <div v-if="showLicense" data-overlay @click="showLicense = false">
      <BaseCard :title="t('license.mitLicense')" @click.stop>
        <template #titleActions>
          <button data-close @click="showLicense = false">&times;</button>
        </template>

        <p data-license-copyright>Copyright &copy; {{ currentYear }} Club Selection</p>
        <p>{{ t('license.permission') }}</p>
        <p>{{ t('license.conditions') }}</p>
        <p data-license-disclaimer>{{ t('license.disclaimer') }}</p>
      </BaseCard>
    </div>
  </Teleport>
</template>
