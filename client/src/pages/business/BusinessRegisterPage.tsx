import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import {
  Building2,
  User as UserIcon,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const BusinessRegisterPage: React.FC = () => {
  const { register, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    companyName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Automatically clear errors whenever navigating to or from this page
  useEffect(() => {
    setServerError(null);
    clearError();
    return () => {
      setServerError(null);
      clearError();
    };
  }, [location.pathname, clearError]);

  // Auto-dismiss errors after 5 seconds
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
    const errors: {
      name?: string;
      companyName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company or business name is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Authorized contact person name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Company business email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid business email address';
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
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'company',
      });
      navigate('/business', { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Failed to register merchant company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/50 to-zinc-50 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 text-white shadow-md shadow-zinc-950/10 mb-2">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Register Merchant Entity
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Create an enterprise seller account to list products, fulfill orders, and configure payouts.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-5">
          {serverError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="business-register-company"
              label="Company Legal Name"
              type="text"
              name="companyName"
              placeholder="e.g. Apex Audio Labs LLC"
              value={formData.companyName}
              onChange={handleChange}
              error={formErrors.companyName}
              icon={<Building2 className="w-4 h-4 text-zinc-400" />}
              disabled={submitting}
            />

            <Input
              id="business-register-name"
              label="Authorized Representative Name"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="e.g. Alex Morgan"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              icon={<UserIcon className="w-4 h-4 text-zinc-400" />}
              disabled={submitting}
            />

            <Input
              id="business-register-email"
              label="Corporate Business Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              icon={<Mail className="w-4 h-4 text-zinc-400" />}
              disabled={submitting}
            />

            <div className="relative">
              <Input
                id="business-register-password"
                label="Merchant Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                icon={<Lock className="w-4 h-4 text-zinc-400" />}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[32px] text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none p-1 cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <Input
              id="business-register-confirm-password"
              label="Confirm Merchant Password"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              icon={<Lock className="w-4 h-4 text-zinc-400" />}
              disabled={submitting}
            />

            <button
              id="business-register-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-xs active:scale-[0.99] cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Merchant Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted with HTTP-only 256-bit JWT authentication</span>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Already registered as a business?{' '}
          <Link
            to="/business/login"
            className="font-semibold text-zinc-950 hover:underline transition-colors"
          >
            Sign in to portal
          </Link>
        </p>
      </div>
    </main>
  );
};
