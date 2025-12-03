<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { BaseCard, BaseButton } from '@/components/ui';

const router = useRouter();
const { t } = useI18n();
</script>

<template>
  <section data-bg="glow" data-padding="section">
    <div data-home-hero>
      <h1>{{ t('home.welcome') }}</h1>
      <p>{{ t('home.tagline') }}</p>
    </div>
  </section>

  <section data-home-features>
    <BaseCard :title="t('home.adminLogin')" data-clickable @click="router.push('/login')">
      <p data-feature-description>{{ t('home.adminFeatures.description') }}</p>
      <ul data-feature-list>
        <li>{{ t('home.adminFeatures.feature1') }}</li>
        <li>{{ t('home.adminFeatures.feature2') }}</li>
        <li>{{ t('home.adminFeatures.feature3') }}</li>
        <li>{{ t('home.adminFeatures.feature4') }}</li>
        <li>{{ t('home.adminFeatures.feature5') }}</li>
      </ul>
      <template #actions>
        <BaseButton variant="primary" style="width: 100%;">
          {{ t('home.adminLogin') }}
        </BaseButton>
      </template>
    </BaseCard>
    <BaseCard :title="t('home.studentEnrollment')" data-clickable @click="router.push('/enroll')">
      <p data-feature-description>{{ t('home.studentFeatures.description') }}</p>
      <ul data-feature-list>
        <li>{{ t('home.studentFeatures.feature1') }}</li>
        <li>{{ t('home.studentFeatures.feature2') }}</li>
        <li>{{ t('home.studentFeatures.feature3') }}</li>
        <li>{{ t('home.studentFeatures.feature4') }}</li>
        <li>{{ t('home.studentFeatures.feature5') }}</li>
      </ul>
      <template #actions>
        <BaseButton variant="secondary" style="width: 100%;">
          {{ t('home.studentEnrollment') }}
        </BaseButton>
      </template>
    </BaseCard>
  </section>
</template>
