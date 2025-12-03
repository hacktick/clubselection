import { useAuthStore } from '@/stores/auth';

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Centralized API service for making authenticated requests to the backend
 * Automatically includes JWT Bearer token in all requests
 */
class ApiService {
  private baseUrl = '/api';

  /**
   * Make an authenticated API request
   * @param endpoint - API endpoint (will be prefixed with /api)
   * @param options - Fetch options with optional skipAuth flag
   * @returns Response object
   */
  async request(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
    const { skipAuth = false, headers = {}, ...fetchOptions } = options;
    const authStore = useAuthStore();

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    // Add JWT token if available and not skipped
    if (!skipAuth && authStore.jwtToken) {
      requestHeaders['Authorization'] = `Bearer ${authStore.jwtToken}`;
    }

    // Make request
    const url = endpoint.startsWith('/') ? endpoint : `${this.baseUrl}/${endpoint}`;
    return fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });
  }

  /**
   * GET request
   */
  async get(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch(endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Export singleton instance
export const api = new ApiService();
