import { useAuthStore } from '@/stores/auth';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const authStore = useAuthStore();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth header if available
  const authHeader = authStore.getAuthHeader();
  if (authHeader.Authorization) {
    headers['Authorization'] = authHeader.Authorization;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
