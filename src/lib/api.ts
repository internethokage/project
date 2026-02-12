const API_BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'giftable-token';
const USER_KEY = 'giftable-user';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  occasion_count: number;
  people_count: number;
  gift_count: number;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'session_expired' } }));
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const authApi = {
  async register(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const data = await api.post<{ token: string; user: AuthUser }>('/api/auth/register', { email, password });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const data = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout', {});
    } catch {
      // Ignore errors on logout
    }
    clearToken();
  },

  async verify(): Promise<{ valid: boolean; user?: AuthUser }> {
    const token = getToken();
    if (!token) return { valid: false };
    try {
      const data = await api.get<{ valid: boolean; user: AuthUser }>('/api/auth/verify');
      if (data.valid && data.user) {
        setStoredUser(data.user);
      }
      return data;
    } catch {
      clearToken();
      return { valid: false };
    }
  },

  async getUser(): Promise<AuthUser | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const data = await api.get<{ user: AuthUser }>('/api/auth/me');
      setStoredUser(data.user);
      return data.user;
    } catch {
      return getStoredUser();
    }
  },
};

export const adminApi = {
  listUsers: () => api.get<{ users: AdminUser[] }>('/api/admin/users'),
  setAdmin: (userId: string, isAdmin: boolean) => api.patch<{ user: AdminUser }>(`/api/admin/users/${userId}/admin`, { isAdmin }),
  deleteUser: (userId: string) => api.delete<{ message: string }>(`/api/admin/users/${userId}`),
  createResetLink: (userId: string) => api.post<{ resetUrl: string }>(`/api/admin/users/${userId}/reset-link`, {}),
};
