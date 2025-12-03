<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseAlert, BaseCard } from '@/components/ui';

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
      error.value = data.error || 'Login failed';
      loading.value = false;
      return;
    }

    authStore.setAdmin(data.admin, data.token);
    router.push('/admin');
  } catch (err) {
    error.value = 'Network error. Please try again.';
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section data-bg="glow" data-center-content>
    <BaseCard title="Admin Login" style="max-width: 50vw; min-width: 350px;">
      <p data-subtitle>Sign in to manage projects and enrollments</p>

      <form @submit.prevent="handleLogin">
        <fieldset>
          <label for="username">Username</label>
          <BaseInput
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            required
            :disabled="loading"
          />
        </fieldset>

        <fieldset>
          <label for="password">Password</label>
          <BaseInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            required
            :disabled="loading"
          />
        </fieldset>

        <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

        <small>Default credentials: admin / admin</small>
      </form>

      <template #actions>
        <BaseButton type="submit" variant="primary" :loading="loading" @click="handleLogin">
          Sign In
        </BaseButton>
      </template>
    </BaseCard>
  </section>
</template>
