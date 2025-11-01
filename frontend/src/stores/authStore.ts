import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/api.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccessModule: (module: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
        }
      },

      // Computed values
      getUserRole: () => get().user?.role || null,
      getUserId: () => get().user?._id || null,
      getFullName: () => {
        const user = get().user;
        return user ? `${user.firstName} ${user.lastName}` : null;
      },
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;

        // Define permissions based on roles
        const permissions = {
          admin: [
            'read:patients', 'write:patients', 'delete:patients',
            'read:orders', 'write:orders', 'delete:orders',
            'read:results', 'write:results', 'delete:results',
            'read:reports', 'write:reports', 'delete:reports',
            'read:tests', 'write:tests', 'delete:tests',
            'read:users', 'write:users', 'delete:users',
            'system:admin',
          ],
          doctor: [
            'read:patients', 'write:patients',
            'read:orders', 'write:orders',
            'read:results', 'write:results',
            'read:reports', 'write:reports',
            'read:tests',
          ],
          lab_technician: [
            'read:patients', 'read:orders',
            'read:results', 'write:results', 'delete:results',
            'read:reports', 'write:reports',
            'read:tests', 'write:tests', 'delete:tests',
          ],
          nurse: [
            'read:patients', 'write:patients',
            'read:orders', 'write:orders',
            'read:results',
            'read:reports',
            'read:tests',
          ],
          receptionist: [
            'read:patients', 'write:patients',
            'read:orders', 'write:orders',
            'read:results',
            'read:reports',
            'read:tests',
          ],
        };

        return permissions[user.role as keyof typeof permissions]?.includes(permission) || false;
      },
      hasRole: (role: string) => {
        const user = get().user;
        return user?.role === role;
      },
      canAccessModule: (module: string) => {
        const user = get().user;
        if (!user) return false;

        const modulePermissions = {
          patients: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
          orders: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
          results: ['admin', 'doctor', 'lab_technician'],
          reports: ['admin', 'doctor', 'lab_technician'],
          tests: ['admin', 'doctor', 'lab_technician'],
          users: ['admin'],
          dashboard: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
          settings: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
        };

        return modulePermissions[module as keyof typeof modulePermissions]?.includes(user.role) || false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;