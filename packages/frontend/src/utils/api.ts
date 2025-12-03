import { useAuthStore } from '@/stores/auth';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const authStore = useAuthStore();

  const headers = {
    'Content-Type': 'application/json',
    ...authStore.getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
