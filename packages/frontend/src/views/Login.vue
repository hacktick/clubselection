<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseAlert, BaseCard } from '@/components/ui';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;

  try {
    const response = await api.post('/api/login', {
      username: username.value,
      password: password.value,
    }, { skipAuth: true });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('auth.loginFailed');
      loading.value = false;
      return;
    }

    authStore.setAdmin(data.admin, data.token);
    router.push('/admin');
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section data-bg="glow" data-center-content>
    <BaseCard :title="t('auth.adminLogin')" style="max-width: 50vw; min-width: 350px;">
      <p data-subtitle>{{ t('auth.adminLoginSubtitle') }}</p>

      <form @submit.prevent="handleLogin">
        <fieldset>
          <label for="username">{{ t('auth.username') }}</label>
          <BaseInput
            id="username"
            v-model="username"
            type="text"
            :placeholder="t('auth.usernamePlaceholder')"
            required
            :disabled="loading"
          />
        </fieldset>

        <fieldset>
          <label for="password">{{ t('auth.password') }}</label>
          <BaseInput
            id="password"
            v-model="password"
            type="password"
            :placeholder="t('auth.passwordPlaceholder')"
            required
            :disabled="loading"
          />
        </fieldset>

        <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

        <small>{{ t('auth.defaultCredentials') }}</small>
      </form>

      <template #actions>
        <BaseButton type="submit" variant="primary" :loading="loading" @click="handleLogin">
          {{ t('auth.signIn') }}
        </BaseButton>
      </template>
    </BaseCard>
  </section>
</template>
