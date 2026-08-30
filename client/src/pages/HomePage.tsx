import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, loading, logout } = useAuth();

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">
            Checking session...
          </p>
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 font-bold text-xl">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    Welcome back, {user.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    You are securely authenticated via HTTP-only JWT cookies.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Session
                </span>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-xs">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900">
                Account Information
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Details verified from the backend <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/api/auth/me</code> route.
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-gray-50/70 border border-gray-100">
                <UserIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500">Full Name</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">
                    {user.name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-gray-50/70 border border-gray-100">
                <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500">Email Address</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-gray-50/70 border border-gray-100">
                <ShieldCheck className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500">Role</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-gray-50/70 border border-gray-100">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-500">Member Since</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Just now'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Lock className="w-4 h-4 text-gray-400" />
                <span>Authentication token stored securely in HTTP-only cookie.</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Unauthenticated Home State */
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            E-Commerce Platform
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto mt-2">
            Secure, scalable authentication system built with React, TypeScript, Express, and MongoDB.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-xs transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-lg transition-colors"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
};
