import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/AuthService';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/api.types';
import { useAuthStore } from '@/stores/authStore';

export const useLogin = () => {
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

export const useRegister = () => {
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data: AuthResponse) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still logout locally even if API call fails
      logout();
    },
  });
};

export const useRefreshToken = () => {
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.refreshToken(),
    onSuccess: (data: { accessToken: string }) => {
      // Only update the access token, keep the existing refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        setTokens(data.accessToken, refreshToken);
      }
    },
    onError: (error) => {
      console.error('Token refresh failed:', error);
    },
  });
};

// Note: getProfile and updateProfile methods are not implemented in AuthService yet
// export const useProfile = () => {
//   const { user } = useAuthStore();
//
//   return useQuery({
//     queryKey: ['profile'],
//     queryFn: () => authService.getProfile(),
//     enabled: !!user,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };
//
// export const useUpdateProfile = () => {
//   const { setUser } = useAuthStore();
//
//   return useMutation({
//     mutationFn: (userData: Partial<any>) => authService.updateProfile(userData),
//     onSuccess: (updatedUser: any) => {
//       setUser(updatedUser);
//     },
//     onError: (error) => {
//       console.error('Profile update failed:', error);
//     },
//   });
// };