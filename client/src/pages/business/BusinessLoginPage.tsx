import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Building2, ArrowRight, ShieldCheck } from 'lucide-react';

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
      setServerError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/50 to-zinc-50 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 text-white shadow-md shadow-zinc-900/10 mb-2">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Merchant Business Portal
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Manage your merchant store catalog, product inventory, and customer orders.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-5">
          {(serverError || authError) && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{serverError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="business-login-email"
              label="Company Business Email"
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
                id="business-login-password"
                label="Merchant Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter password"
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

            <button
              id="business-login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-xs active:scale-[0.99] cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Merchant Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
              <span>RBAC Protected</span>
            </div>
            <Link
              to="/business/register"
              className="font-semibold text-zinc-950 hover:underline"
            >
              Register New Merchant Entity
            </Link>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-zinc-500">
            New business vendor?{' '}
            <Link
              to="/business/register"
              className="font-semibold text-zinc-950 hover:underline"
            >
              Apply for merchant account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
