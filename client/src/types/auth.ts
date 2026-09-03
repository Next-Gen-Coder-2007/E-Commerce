export type UserRole = 'customer' | 'company' | 'admin';

export interface SavedAddress {
  _id?: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface BusinessAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface BankDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  currency?: string;
}

export interface BusinessDetails {
  taxId?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  storeDescription?: string;
  businessAddress?: BusinessAddress;
  bankDetails?: BankDetails;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  companyName?: string;
  avatar?: string;
  googleId?: string;
  savedAddresses?: SavedAddress[];
  businessDetails?: BusinessDetails;
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
  portal?: 'customer' | 'business';
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateBusinessDetailsInput {
  companyName?: string;
  taxId?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  storeDescription?: string;
  businessAddress?: BusinessAddress;
  bankDetails?: BankDetails;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token?: string;
  savedAddresses?: SavedAddress[];
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
  googleLogin: (credential: string, portal?: 'customer' | 'business') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  updateBusinessDetails: (input: UpdateBusinessDetailsInput) => Promise<boolean>;
  addSavedAddress: (address: SavedAddress) => Promise<boolean>;
  updateSavedAddress: (addressId: string, address: SavedAddress) => Promise<boolean>;
  deleteSavedAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
}
