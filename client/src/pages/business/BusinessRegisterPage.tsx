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
import { BrutalistButton } from '../../components/BrutalistButton';
import { RawAtmosphere } from '../../components/RawAtmosphere';

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
      setServerError(err.message || 'Failed to register merchant entity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-[#E4E2DD] relative overflow-hidden">
      <RawAtmosphere />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] text-[10px] font-mono font-bold uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5 text-[#FF89A9]" />
            <span>ENTERPRISE ENROLLMENT</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-clash font-bold tracking-tight text-[#1E1E1E] uppercase leading-none">
            Register Merchant Entity
          </h1>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Establish a verified merchant presence on the distributed marketplace.
          </p>
        </div>

        <div className="border-2 border-[#1E1E1E] bg-white p-8 sm:p-10 shadow-[10px_10px_0px_#1E1E1E] space-y-5">
          {serverError && (
            <div className="flex items-start gap-3 p-3.5 border-2 border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#1E1E1E] text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-[#DB4A2B] shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="business-reg-company"
              label="Legal Entity / Brand Name"
              type="text"
              name="companyName"
              placeholder="e.g. Apex Electronics Co."
              value={formData.companyName}
              onChange={handleChange}
              error={formErrors.companyName}
              icon={<Building2 className="w-4 h-4 text-[#1E1E1E]" />}
              disabled={submitting}
            />

            <Input
              id="business-reg-name"
              label="Authorized Principal Officer"
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              icon={<UserIcon className="w-4 h-4 text-[#1E1E1E]" />}
              disabled={submitting}
            />

            <Input
              id="business-reg-email"
              label="Business Operations Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="operations@domain.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              icon={<Mail className="w-4 h-4 text-[#1E1E1E]" />}
              disabled={submitting}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  id="business-reg-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  icon={<Lock className="w-4 h-4 text-[#1E1E1E]" />}
                  disabled={submitting}
                />
              </div>

              <div className="relative">
                <Input
                  id="business-reg-confirm"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formErrors.confirmPassword}
                  icon={<Lock className="w-4 h-4 text-[#1E1E1E]" />}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="pt-2">
              <BrutalistButton
                type="submit"
                disabled={submitting}
                loading={submitting}
                variant="primary"
                className="w-full"
              >
                <span>Register Merchant Entity</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </BrutalistButton>
            </div>
          </form>

          {/* Login Link */}
          <div className="pt-6 border-t-2 border-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-[#444444] uppercase">Already registered?</span>
            <Link
              to="/business/login"
              className="font-bold text-[#DB4A2B] hover:text-[#1E1E1E] uppercase underline tracking-wider"
            >
              Sign In to Console →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BusinessRegisterPage;
