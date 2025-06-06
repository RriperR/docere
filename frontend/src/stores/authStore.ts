import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/api';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  access: string;
  refresh: string;
  firstName?: string;
  lastName?: string;
  specialization?: string; // for doctors
  dateOfBirth?: string; // for patients
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // 1. Получить токены
          const { data } = await api.post('/token/', { email, password });
          const access = data.access;
          const refresh = data.refresh;

          // 2. Получить профиль пользователя (пример endpoint: /users/me/)
          const profileResponse = await api.get('/users/me/', {
            headers: { Authorization: `Bearer ${access}` }
          });

          const userData = profileResponse.data;

          set({
            user: {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              access,
              refresh,
              firstName: userData.first_name,
              lastName: userData.last_name,
              // ... другие поля по профилю
            },
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: 'Неправильная почта или пароль',
            isLoading: false
          });
        }
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/user/register/', { email, password });
          // Далее вызываем login
          await get().login(email, password);
        } catch (error: any) {
          set({
            error: 'Регистрация не удалась. Попробуйте ещё раз.',
            isLoading: false
          });
        }
      },


      logout: () => {
        set({
          user: null,
          isAuthenticated: false
        });
      },

      updateUserProfile: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);