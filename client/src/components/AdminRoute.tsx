import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400">Verifying Admin Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-zinc-50">
        <div className="bg-white border border-rose-100 rounded-2xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-zinc-900">Access Restricted</h2>
          <p className="text-sm text-zinc-600">
            This administration console is restricted to platform administrators. Your account ({user.email}) currently has the role <code className="bg-zinc-100 px-1.5 py-0.5 rounded font-bold text-zinc-800">{user.role}</code>.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition"
          >
            Return to Storefront
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
