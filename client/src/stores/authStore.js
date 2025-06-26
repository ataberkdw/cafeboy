import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username, password) => {
        console.log('🔐 Frontend login isteği:', { username, password });
        set({ isLoading: true, error: null });
        
        try {
          console.log('📡 API isteği gönderiliyor...');
          const response = await api.post('/auth/login', {
            username,
            password
          });

          console.log('✅ API yanıtı:', response.data);
          const { admin } = response.data;
          
          set({
            user: admin,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          console.error('❌ Login hatası:', error);
          console.error('❌ Error response:', error.response?.data);
          const errorMessage = error.response?.data?.error || 'Giriş başarısız';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      checkAuth: async () => {
        try {
          const response = await api.get('/auth/me');
          const { admin } = response.data;
          
          set({
            user: admin,
            isAuthenticated: true,
            error: null
          });
          
          return true;
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            error: null
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
export { useAuthStore }; 