<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseAlert, BaseEmptyState, BaseCard } from '@/components/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = ref('');
const loading = ref(false);
const error = ref('');
const autoSubmitting = ref(false);

async function validateToken() {
  if (!token.value.trim()) {
    error.value = t('auth.pleaseEnterToken');
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await api.post('/api/students/validate-token', {
      token: token.value
    }, { skipAuth: true });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('auth.invalidToken');
      loading.value = false;
      return;
    }

    authStore.setStudent(data.student, data.token);
    router.push('/student/projects');
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const queryToken = route.query.token as string;
  if (queryToken) {
    token.value = queryToken;
    autoSubmitting.value = true;
    validateToken();
  }
});
</script>

<template>
  <section data-bg="glow" data-center-content>
    <BaseCard :title="t('auth.studentEnrollment')" style="max-width: 50vw; min-width: 350px;">
      <BaseEmptyState v-if="autoSubmitting" loading :message="t('auth.validatingToken')" />

      <div v-else>
        <p data-subtitle>{{ t('auth.studentEnrollmentSubtitle') }}</p>

        <form @submit.prevent="validateToken">
          <fieldset>
            <label for="token">{{ t('auth.enrollmentToken') }}</label>
            <BaseInput
              id="token"
              v-model="token"
              type="text"
              :placeholder="t('auth.tokenPlaceholder')"
              :disabled="loading"
            />
          </fieldset>

          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
        </form>
      </div>

      <template #actions>
        <BaseButton type="submit" variant="primary" :loading="loading" @click="validateToken">
          {{ t('auth.enter') }}
        </BaseButton>
      </template>
    </BaseCard>
  </section>
</template>
