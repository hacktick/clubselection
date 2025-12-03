<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseAlert, BaseEmptyState, BaseCard } from '@/components/ui';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = ref('');
const loading = ref(false);
const error = ref('');
const autoSubmitting = ref(false);

async function validateToken() {
  if (!token.value.trim()) {
    error.value = 'Please enter a token';
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
      error.value = data.error || 'Invalid token';
      loading.value = false;
      return;
    }

    authStore.setStudent(data.student, data.token);
    router.push('/student/projects');
  } catch (err) {
    error.value = 'Network error. Please try again.';
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
    <BaseCard title="Student Enrollment" style="max-width: 50vw; min-width: 350px;">
      <BaseEmptyState v-if="autoSubmitting" loading message="Validating your token..." />

      <div v-else>
        <p data-subtitle>Enter your enrollment token to access your projects</p>

        <form @submit.prevent="validateToken">
          <fieldset>
            <label for="token">Enrollment Token</label>
            <BaseInput
              id="token"
              v-model="token"
              type="text"
              placeholder="Enter your token"
              :disabled="loading"
            />
          </fieldset>

          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
        </form>
      </div>

      <template #actions>
        <BaseButton type="submit" variant="primary" :loading="loading" @click="validateToken">
          Enter
        </BaseButton>
      </template>
    </BaseCard>
  </section>
</template>
