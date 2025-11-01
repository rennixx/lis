export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  permissions: string[]
  created_at: string
  phone?: string
  address?: string
  specialization?: string
  department?: string
  license_number?: string
}

export type UserRole = 'admin' | 'doctor' | 'lab_technician' | 'nurse' | 'receptionist'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  full_name: string
  password: string
  confirm_password: string
  phone?: string
  address?: string
  specialization?: string
  department?: string
  license_number?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  new_password: string
  confirm_password: string
}