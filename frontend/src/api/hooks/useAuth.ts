import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/AuthService';
import { LoginRequest, RegisterRequest } from '@/types/api.types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  users: () => [...authKeys.all, 'users'] as const,
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// Get all users (admin only)
export const useUsers = () => {
  return useQuery({
    queryKey: authKeys.users(),
    queryFn: () => authService.getAllUsers(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: authService.isAuthenticated(),
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Store auth data
      authService.setAuthData(data);

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      console.log('Login successful');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // Clear any existing auth data
      authService.clearAuthData();
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data) => {
      // Store auth data
      authService.setAuthData(data);

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      console.log('Registration successful');
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      console.log('Logout successful');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still clear local data even if server logout fails
      authService.clearAuthData();
      queryClient.clear();
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      console.log('Password changed successfully');
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      console.log('Password reset email sent');
    },
    onError: (error) => {
      console.error('Failed to send password reset email:', error);
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      authService.resetPassword(data),
    onSuccess: () => {
      console.log('Password reset successful');
    },
    onError: (error) => {
      console.error('Password reset failed:', error);
    },
  });
};

// Update user role mutation
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      authService.updateUserRole(userId, role),
    onSuccess: () => {
      // Refetch users list
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
      console.log('User role updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update user role:', error);
    },
  });
};

// Toggle user status mutation
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authService.toggleUserStatus(userId),
    onSuccess: () => {
      // Refetch users list
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
      console.log('User status toggled successfully');
    },
    onError: (error) => {
      console.error('Failed to toggle user status:', error);
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: any) => authService.updateProfile(userData),
    onSuccess: (updatedUser) => {
      // Update cached user data
      queryClient.setQueryData(authKeys.user(), updatedUser);
      console.log('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  return useMutation({
    mutationFn: () => authService.refreshToken(),
    onError: (error) => {
      console.error('Token refresh failed:', error);
      // Clear auth data and redirect to login
      authService.clearAuthData();
      window.location.href = '/login';
    },
  });
};

// Verify email mutation
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      console.log('Email verified successfully');
    },
    onError: (error) => {
      console.error('Email verification failed:', error);
    },
  });
};