import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type {
  User,
  RegisterInput,
  LoginInput,
  AuthContextType,
  SavedAddress,
  UpdateProfileInput,
  UpdateBusinessDetailsInput,
} from '../types/auth';
import {
  registerApi,
  loginApi,
  googleLoginApi,
  logoutApi,
  getMeApi,
  updateProfileApi,
  updateBusinessDetailsApi,
  addSavedAddressApi,
  updateSavedAddressApi,
  deleteSavedAddressApi,
  setDefaultAddressApi,
} from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setError(null);
  }, []);

  const setTimedError = useCallback((msg: string) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setError(msg);
    errorTimerRef.current = setTimeout(() => {
      setError(null);
      errorTimerRef.current = null;
    }, 5000);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMeApi();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const register = async (input: RegisterInput) => {
    setLoading(true);
    clearError();
    try {
      const data = await registerApi(input);
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
      }
      setUser(data.user);
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setTimedError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (input: LoginInput) => {
    setLoading(true);
    clearError();
    try {
      const data = await loginApi(input);
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
      }
      setUser(data.user);
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password';
      setTimedError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential: string, portal: 'customer' | 'business' = 'customer') => {
    setLoading(true);
    clearError();
    try {
      const data = await googleLoginApi(credential, portal);
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
      }
      setUser(data.user);
    } catch (err: any) {
      const msg = err.message || 'Google authentication failed';
      setTimedError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    clearError();
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      await logoutApi();
      setUser(null);
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (input: UpdateProfileInput): Promise<boolean> => {
    try {
      const res = await updateProfileApi(input);
      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedError(err.message || 'Failed to update profile');
      return false;
    }
  };

  const updateBusinessDetails = async (input: UpdateBusinessDetailsInput): Promise<boolean> => {
    try {
      const res = await updateBusinessDetailsApi(input);
      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedError(err.message || 'Failed to update business details');
      return false;
    }
  };

  const addSavedAddress = async (address: SavedAddress): Promise<boolean> => {
    try {
      const res = await addSavedAddressApi(address);
      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedError(err.message || 'Failed to save address');
      return false;
    }
  };

  const updateSavedAddress = async (addressId: string, address: SavedAddress): Promise<boolean> => {
    try {
      const res = await updateSavedAddressApi(addressId, address);
      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedError(err.message || 'Failed to update address');
      return false;
    }
  };

  const deleteSavedAddress = async (addressId: string): Promise<boolean> => {
    try {
      const res = await deleteSavedAddressApi(addressId);
      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedError(err.message || 'Failed to delete address');
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    try {
      const res = await setDefaultAddressApi(addressId);
      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedError(err.message || 'Failed to set default address');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        googleLogin,
        logout,
        clearError,
        refreshUser,
        updateProfile,
        updateBusinessDetails,
        addSavedAddress,
        updateSavedAddress,
        deleteSavedAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
