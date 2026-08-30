export type UserRole = 'customer' | 'company' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  avatar?: string;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: 'customer' | 'company';
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}
