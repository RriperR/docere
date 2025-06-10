import { create } from 'zustand';
import api from '../api/api';

interface TokenData {
  access: string;
  refresh: string;
}

interface UserData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  birthday: string | null;
  photo: string | null;
  role: 'doctor' | 'patient' | 'admin';
}

interface AuthState {
  tokens: TokenData | null;
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
  isAuthenticated: boolean;
  updateProfile: (updates: {
    first_name?: string;
    last_name?: string;
    middle_name?: string | null;
    phone?: string | null;
    birthday?: string | null;
    photo?: string | null;
  }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  tokens: JSON.parse(localStorage.getItem('authTokens') || 'null'),
  user: JSON.parse(localStorage.getItem('authUserData') || 'null'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('authTokens'),

  async register(email, password) {
    set({ isLoading: true, error: null });
    try {
      await api.post('/user/register/', { email, password });

      const { data: tokens } = await api.post('/token/', {
        username: email,
        password,
      });

      const { data: user } = await api.get('/user/me/', {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('authUserData', JSON.stringify(user));

      set({ tokens, user, isLoading: false, isAuthenticated: true });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw err;
    }
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const { data: tokens } = await api.post('/token/', {
        username: email,
        password,
      });

      const { data: user } = await api.get('/user/me/', {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('authUserData', JSON.stringify(user));

      set({ tokens, user, isLoading: false, isAuthenticated: true });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Login failed',
        isLoading: false,
      });
      throw err;
    }
  },

  logout() {
    localStorage.removeItem('authTokens');
    localStorage.removeItem('authUserData');
    set({ tokens: null, user: null, isAuthenticated: false });
  },

  restoreSession() {
    const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
    const user = JSON.parse(localStorage.getItem('authUserData') || 'null');
    set({ tokens, user, isAuthenticated: !!tokens });
  },

  async updateProfile(updates) {
    set({ isLoading: true, error: null });
    try {
      // PUT /user/me/
      const { data: updated } = await api.put<UserData>('/user/me/', updates);
      // Запишем в localStorage
      localStorage.setItem('authUserData', JSON.stringify(updated));
      // Обновим в zustand
      set({ user: updated, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data ? JSON.stringify(err.response.data) : 'Update failed',
        isLoading: false,
      });
      throw err;
    }
  },
}));
