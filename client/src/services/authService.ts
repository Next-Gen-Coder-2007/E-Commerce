import api from './api';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
  SavedAddress,
  UpdateProfileInput,
  UpdateBusinessDetailsInput,
} from '../types/auth';

export const registerApi = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const loginApi = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const googleLoginApi = async (
  credential: string,
  portal: 'customer' | 'business' = 'customer'
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/google', {
    credential,
    portal,
  });
  return response.data;
};

export const logoutApi = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>(
    '/auth/logout'
  );
  return response.data;
};

export const getMeApi = async (): Promise<{ success: boolean; user: User }> => {
  const response = await api.get<{ success: boolean; user: User }>('/auth/me');
  return response.data;
};

export const updateProfileApi = async (
  data: UpdateProfileInput
): Promise<{ success: boolean; message: string; user: User }> => {
  const response = await api.put<{ success: boolean; message: string; user: User }>(
    '/auth/profile',
    data
  );
  return response.data;
};

export const updateBusinessDetailsApi = async (
  data: UpdateBusinessDetailsInput
): Promise<{ success: boolean; message: string; user: User }> => {
  const response = await api.put<{ success: boolean; message: string; user: User }>(
    '/auth/business-details',
    data
  );
  return response.data;
};

export const addSavedAddressApi = async (
  data: SavedAddress
): Promise<{ success: boolean; message: string; savedAddresses: SavedAddress[]; user: User }> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    savedAddresses: SavedAddress[];
    user: User;
  }>('/auth/addresses', data);
  return response.data;
};

export const updateSavedAddressApi = async (
  addressId: string,
  data: SavedAddress
): Promise<{ success: boolean; message: string; savedAddresses: SavedAddress[]; user: User }> => {
  const response = await api.put<{
    success: boolean;
    message: string;
    savedAddresses: SavedAddress[];
    user: User;
  }>(`/auth/addresses/${addressId}`, data);
  return response.data;
};

export const deleteSavedAddressApi = async (
  addressId: string
): Promise<{ success: boolean; message: string; savedAddresses: SavedAddress[]; user: User }> => {
  const response = await api.delete<{
    success: boolean;
    message: string;
    savedAddresses: SavedAddress[];
    user: User;
  }>(`/auth/addresses/${addressId}`);
  return response.data;
};

export const setDefaultAddressApi = async (
  addressId: string
): Promise<{ success: boolean; message: string; savedAddresses: SavedAddress[]; user: User }> => {
  const response = await api.put<{
    success: boolean;
    message: string;
    savedAddresses: SavedAddress[];
    user: User;
  }>(`/auth/addresses/${addressId}/default`);
  return response.data;
};
