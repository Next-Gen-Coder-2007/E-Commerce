import api from './api';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '../types/auth';

/**
 * Register a new user with name, email, and password.
 */
export const registerApi = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

/**
 * Log in with email and password.
 */
export const loginApi = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

/**
 * Log in or register via Google ID token.
 */
export const googleLoginApi = async (
  credential: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/google', {
    credential,
  });
  return response.data;
};

/**
 * Log out and clear the HTTP-only cookie.
 */
export const logoutApi = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>(
    '/auth/logout'
  );
  return response.data;
};

/**
 * Restore logged-in user session from HTTP-only cookie.
 */
export const getMeApi = async (): Promise<{ success: boolean; user: User }> => {
  const response = await api.get<{ success: boolean; user: User }>('/auth/me');
  return response.data;
};
