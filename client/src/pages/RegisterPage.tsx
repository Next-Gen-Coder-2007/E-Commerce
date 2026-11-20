import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { RawAtmosphere } from '../components/RawAtmosphere';
import {
  User as UserIcon,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, clearError, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from =
    redirectParam ||
    (location.state as any)?.from?.pathname ||
    (location.state as any)?.from ||
    '/';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setServerError(null);
    clearError();
    return () => {
      setServerError(null);
      clearError();
    };
  }, [location.pathname, clearError]);

  const validate = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) {
      setServerError(null);
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);
    clearError();

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'customer',
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Failed to establish customer registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4.5rem)] flex items-stretch bg-[#E4E2DD] text-[#1E1E1E] font-satoshi relative overflow-hidden">
      <RawAtmosphere variant="vibrant" />

      {/* Split Screen Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#1E1E1E]">
        {/* Left Side: Editorial Typography Banner */}
        <div className="lg:col-span-6 p-8 sm:p-14 lg:p-20 flex flex-col justify-between relative bg-[#D9D6D0]/40">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-[#1E1E1E] text-[#FF89A9] text-[10px] font-mono font-bold uppercase tracking-widest">
              COLLECTOR ENROLLMENT
            </span>
            <h1 className="font-clash text-5xl sm:text-7xl lg:text-8xl font-bold uppercase tracking-[-0.05em] text-[#1E1E1E] leading-[0.9]">
              JOIN THE REGISTRY
            </h1>
          </div>

          <div className="space-y-4 pt-12">
            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed max-w-md">
              Create your shopper credential to curate private wishlists, save multi-destination delivery addresses, and unlock exclusive seasonal promotion codes.
            </p>
            <div className="font-mono text-[10px] text-[#444444] uppercase tracking-wider">
              ENTERPRISE COMMERCE // REQUISITION MATRIX 2026
            </div>
          </div>
        </div>

        {/* Right Side: Brutalist Form */}
        <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center bg-[#FFFFFF]">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B]">
                REGISTRATION
              </span>
              <h2 className="font-clash text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1E1E1E]">
                NEW CUSTOMER ACCOUNT
              </h2>
            </div>

            {(serverError || authError) && (
              <div className="p-3.5 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] text-xs font-mono font-bold uppercase flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{serverError || authError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setServerError(null);
                    clearError();
                  }}
                  className="text-[#DB4A2B] hover:text-[#1E1E1E] text-xs font-mono font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div>
              <GoogleAuthButton
                text="signup_with"
                portal="customer"
                onSuccess={() => navigate(from, { replace: true })}
                onError={(msg) => setServerError(msg)}
              />
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-[#1E1E1E]/20" />
              <span className="bg-[#FFFFFF] px-3 font-mono text-[10px] font-bold text-[#444444] uppercase tracking-widest absolute">
                OR REGISTER WITH EMAIL
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="register-name"
                label="Full Name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                error={formErrors.name}
                icon={<UserIcon className="w-4 h-4" />}
                disabled={submitting}
              />

              <Input
                id="register-email"
                label="Email Address"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                icon={<Mail className="w-4 h-4" />}
                disabled={submitting}
              />

              <div className="relative">
                <Input
                  id="register-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  icon={<Lock className="w-4 h-4" />}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-[#444444] hover:text-[#1E1E1E] transition-colors focus:outline-none p-1 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                id="register-confirm-password"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                icon={<Lock className="w-4 h-4" />}
                disabled={submitting}
              />

              <button
                id="register-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full raw-btn py-3.5 px-6 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer group flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-[#E4E2DD] border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>REGISTER ACCOUNT</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#1E1E1E]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span className="text-[#444444]">ALREADY HAVE AN ACCOUNT?</span>
              <Link
                to={`/login${from && from !== '/' ? `?redirect=${encodeURIComponent(from)}` : ''}`}
                className="font-bold text-[#1E1E1E] hover:text-[#DB4A2B] uppercase tracking-wider underline transition-colors"
              >
                SIGN IN HERE →
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#444444] pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TERMS & PRIVACY PROTOCOLS APPLY &bull; 2026</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
