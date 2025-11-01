import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  modals: Record<string, {
    isOpen: boolean;
    title?: string;
    content?: any;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }>;
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  isLoading: boolean;
  currentPage: string;
  breadcrumbs: Array<{
    label: string;
    path: string;
  }>;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  openModal: (key: string, modal: Omit<UIState['modals'][string], 'isOpen'>) => void;
  closeModal: (key: string) => void;
  closeAllModals: () => void;
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: UIState['breadcrumbs']) => void;
  addBreadcrumb: (breadcrumb: UIState['breadcrumbs'][0]) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // State
      sidebarOpen: true,
      theme: 'light',
      modals: {},
      toasts: [],
      isLoading: false,
      currentPage: '',
      breadcrumbs: [],

      // Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        // Apply theme to document root
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      openModal: (key, modal) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [key]: {
              isOpen: true,
              ...modal,
            },
          },
        }));
      },

      closeModal: (key) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [key]: {
              ...state.modals[key],
              isOpen: false,
            },
          },
        }));
      },

      closeAllModals: () => {
        set({ modals: {} });
      },

      addToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, ...toast };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setCurrentPage: (page: string) => {
        set({ currentPage: page });
      },

      setBreadcrumbs: (breadcrumbs) => {
        set({ breadcrumbs });
      },

      addBreadcrumb: (breadcrumb) => {
        set((state) => ({
          breadcrumbs: [...state.breadcrumbs, breadcrumb],
        }));
      },

      // Computed values
      isModalOpen: (key: string) => {
        return get().modals[key]?.isOpen || false;
      },
      getModalContent: (key: string) => {
        return get().modals[key]?.content;
      },
      getToastsByType: (type: 'success' | 'error' | 'warning' | 'info') => {
        return get().toasts.filter((toast) => toast.type === type);
      },
      getActiveModal: () => {
        const modals = get().modals;
        return Object.keys(modals).find((key) => modals[key].isOpen) || null;
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('ui-storage');
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      const theme = parsed.state?.theme;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.error('Failed to parse theme from localStorage:', error);
    }
  }
}

export default useUIStore;