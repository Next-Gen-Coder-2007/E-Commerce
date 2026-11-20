import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { BrutalistButton } from '../../components/BrutalistButton';
import { RawAtmosphere } from '../../components/RawAtmosphere';

export const BusinessLoginPage: React.FC = () => {
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

  const from =
    (location.state as any)?.from?.pathname?.startsWith('/business')
      ? (location.state as any).from.pathname
      : '/business';

  useEffect(() => {
    setServerError(null);
    clearError();
    return () => {
      setServerError(null);
      clearError();
    };
  }, [location.pathname, clearError]);

  useEffect(() => {
    if (serverError || authError) {
      const timer = setTimeout(() => {
        setServerError(null);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [serverError, authError, clearError]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Business email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid business email address';
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
    if (serverError || authError) {
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
      await login({ ...formData, portal: 'business' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Invalid credentials for merchant portal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-[#E4E2DD] relative overflow-hidden">
      <RawAtmosphere />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Top Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5 text-[#FF89A9]" />
            <span>PORTAL ACCESS // SELLER CONSOLE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-clash font-bold tracking-tight text-[#1E1E1E] uppercase leading-none">
            Merchant Authentication
          </h1>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Authorize seller ledger session to govern listings and fulfillments.
          </p>
        </div>

        <div className="border-2 border-[#1E1E1E] bg-white p-8 sm:p-10 shadow-[10px_10px_0px_#1E1E1E] space-y-6">
          {(serverError || authError) && (
            <div className="flex items-start gap-3 p-3.5 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#1E1E1E] text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-[#DB4A2B] shrink-0 mt-0.5" />
              <span>{serverError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="business-login-email"
              label="Company Business Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="seller@domain.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              icon={<Mail className="w-4 h-4 text-[#1E1E1E]" />}
              disabled={submitting}
            />

            <div className="relative">
              <Input
                id="business-login-password"
                label="Merchant Passkey"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                icon={<Lock className="w-4 h-4 text-[#1E1E1E]" />}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[38px] text-[#444444] hover:text-[#1E1E1E] transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <BrutalistButton
                type="submit"
                disabled={submitting}
                loading={submitting}
                variant="primary"
                className="w-full"
              >
                <span>Authorize Merchant Hub</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </BrutalistButton>
            </div>
          </form>

          {/* Quick Registration Link */}
          <div className="pt-6 border-t-2 border-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-[#444444] uppercase">New Seller or Brand?</span>
            <Link
              to="/business/register"
              className="font-bold text-[#DB4A2B] hover:text-[#1E1E1E] uppercase underline tracking-wider"
            >
              Register Entity →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BusinessLoginPage;
