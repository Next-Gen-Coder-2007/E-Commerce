import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from =
    redirectParam ||
    (location.state as any)?.from?.pathname ||
    (location.state as any)?.from ||
    '/';

  useEffect(() => {
    setServerError(null);
    clearError();
    return () => {
      setServerError(null);
      clearError();
    };
  }, [location.pathname, clearError]);

  useEffect(() => {
    if (serverError) {
      const timer = setTimeout(() => {
        setServerError(null);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [serverError, clearError]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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
      await login({ ...formData, portal: 'customer' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4.5rem)] flex items-stretch bg-[#E4E2DD] text-[#1E1E1E] font-satoshi relative overflow-hidden">
      <RawAtmosphere variant="vibrant" />

      {/* Split Screen Layout: Left Editorial Poster / Right Form */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#1E1E1E]">
        {/* Left Side: Oversized Poster Typography */}
        <div className="lg:col-span-6 p-8 sm:p-14 lg:p-20 flex flex-col justify-between relative bg-[#D9D6D0]/40">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-[#1E1E1E] text-[#FF89A9] text-[10px] font-mono font-bold uppercase tracking-widest">
              CUSTOMER IDENTITY GATEWAY
            </span>
            <h1 className="font-clash text-5xl sm:text-7xl lg:text-8xl font-bold uppercase tracking-[-0.05em] text-[#1E1E1E] leading-[0.9]">
              ACCESS THE ARCHIVE
            </h1>
          </div>

          <div className="space-y-4 pt-12">
            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed max-w-md">
              Authenticate to manage customer dispatch orders, track real-time parcel telemetry, review customized size profiles, and configure automated price alerts.
            </p>
            <div className="font-mono text-[10px] text-[#444444] uppercase tracking-wider">
              PROTOCOL // ZERO-TRUST AUTHENTICATION MATRIX &bull; 2026
            </div>
          </div>
        </div>

        {/* Right Side: High-Contrast Minimalist Brutalist Form */}
        <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center bg-[#FFFFFF]">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B]">
                AUTHENTICATION
              </span>
              <h2 className="font-clash text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1E1E1E]">
                SIGN IN TO ACCOUNT
              </h2>
            </div>

            {(serverError || authError) && (
              <div className="p-3.5 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B] text-xs font-mono font-bold uppercase flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError || authError}</span>
              </div>
            )}

            <div>
              <GoogleAuthButton
                text="signin_with"
                portal="customer"
                onSuccess={() => navigate(from, { replace: true })}
                onError={(msg) => setServerError(msg)}
              />
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-[#1E1E1E]/20" />
              <span className="bg-[#FFFFFF] px-3 font-mono text-[10px] font-bold text-[#444444] uppercase tracking-widest absolute">
                OR EMAIL CREDENTIALS
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="login-email"
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
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
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

              <button
                id="login-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full raw-btn py-3.5 px-6 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer group flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-[#E4E2DD] border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>AUTHENTICATE & ENTER</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#1E1E1E]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span className="text-[#444444]">NO ACCOUNT REGISTERED?</span>
              <Link
                to={`/register${from && from !== '/' ? `?redirect=${encodeURIComponent(from)}` : ''}`}
                className="font-bold text-[#1E1E1E] hover:text-[#DB4A2B] uppercase tracking-wider underline transition-colors"
              >
                CREATE CUSTOMER ACCOUNT →
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#444444] pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS ENCRYPTED &bull; 256-BIT JWT TOKEN INTEGRITY</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
