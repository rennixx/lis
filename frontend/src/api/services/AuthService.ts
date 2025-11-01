import { apiPost, apiGet, apiPut } from '../client';
import { ENDPOINTS } from '../endpoints';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiResponse
} from '@/types/api.types';

class AuthService {
  private readonly baseUrl = ENDPOINTS.AUTH;

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>(this.baseUrl.LOGIN, credentials);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>(this.baseUrl.REGISTER, userData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Registration failed');
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiPost(this.baseUrl.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn('Logout request failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Refresh access token
  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiPost<{ accessToken: string }>(this.baseUrl.REFRESH, {
      refreshToken,
    });

    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data;
    }
    throw new Error(response.message || 'Token refresh failed');
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await apiGet<User>(this.baseUrl.ME);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user profile');
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const response = await apiPost(this.baseUrl.CHANGE_PASSWORD, data);
    if (!response.success) {
      throw new Error(response.message || 'Password change failed');
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const response = await apiPost(this.baseUrl.FORGOT_PASSWORD, { email });
    if (!response.success) {
      throw new Error(response.message || 'Failed to send password reset email');
    }
  }

  // Reset password
  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    const response = await apiPost(this.baseUrl.RESET_PASSWORD, data);
    if (!response.success) {
      throw new Error(response.message || 'Password reset failed');
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const response = await apiGet<User[]>(this.baseUrl.USERS);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get users');
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, role: string): Promise<void> {
    const response = await apiPut(`${this.baseUrl.USERS}/${userId}/role`, { role });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update user role');
    }
  }

  // Toggle user active status (admin only)
  async toggleUserStatus(userId: string): Promise<void> {
    const response = await apiPut(`${this.baseUrl.USERS}/${userId}/toggle-status`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to toggle user status');
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiPut<User>(this.baseUrl.ME, userData);
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    throw new Error(response.message || 'Profile update failed');
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    const response = await apiPost('/auth/verify-email', { token });
    if (!response.success) {
      throw new Error(response.message || 'Email verification failed');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // Get stored user
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get stored token
  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Set auth data
  setAuthData(data: AuthResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();
export default authService;