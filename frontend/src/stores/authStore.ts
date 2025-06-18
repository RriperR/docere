// src/stores/authStore.ts
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
  register: (
    firstName: string,
    lastName: string,
    middleName: string | null,
    email: string,
    phone: string | null,
    birthday: string | null,
    password: string
  ) => Promise<void>;
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

  async register(
    firstName,
    lastName,
    middleName,
    email,
    phone,
    birthday,
    password
  ) {
    set({ isLoading: true, error: null });
    try {
      // 1) Регистрируем пользователя
      await api.post('/user/register/', {
        first_name:  firstName,
        last_name:   lastName,
        middle_name: middleName,
        email,
        phone,
        birthday,
        password,
      });

      // 2) Получаем токены
      const { data: tokens } = await api.post<TokenData>('/token/', {
        username: email,
        password,
      });

      // **Сохраняем токены СРАЗУ**, чтобы интерцептор их подхватил**
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      set({ tokens });  // <-- вот этот сет нужен до GET /user/me/

      // 3) Теперь запрос профиля пойдёт с Authorization: Bearer <access>
      const { data: user } = await api.get<UserData>('/user/me/');
      localStorage.setItem('authUserData', JSON.stringify(user));

      // 4) Финальный сет стейта
      set({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw err;
    }
  },

  async login(email: string, password: string) {
  set({ isLoading: true, error: null });
  try {
    // 1) Получаем токены
    const { data: tokens } = await api.post<TokenData>('/token/', {
      username: email,
      password,
    });

    // 2) Сохраняем токены прежде, чем делать GET /user/me/
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    set({ tokens });

    // 3) Теперь запрос профиля пойдёт с нужным Authorization
    const { data: user } = await api.get<UserData>('/user/me/');

    // 4) Сохраняем профиль
    localStorage.setItem('authUserData', JSON.stringify(user));
    set({
      user,
      isLoading: false,
      isAuthenticated: true,
    });
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
      const { data: updated } = await api.put<UserData>('/user/me/', updates);
      localStorage.setItem('authUserData', JSON.stringify(updated));
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
