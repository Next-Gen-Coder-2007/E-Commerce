import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BusinessHomePage } from './pages/business/BusinessHomePage';
import { BusinessLoginPage } from './pages/business/BusinessLoginPage';
import { BusinessRegisterPage } from './pages/business/BusinessRegisterPage';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isBusiness = location.pathname.startsWith('/business');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/60 text-zinc-900">
      {!isBusiness && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          <Route path="/business" element={<BusinessHomePage />} />
          <Route
            path="/business/login"
            element={
              <PublicOnlyRoute>
                <BusinessLoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/business/register"
            element={
              <PublicOnlyRoute>
                <BusinessRegisterPage />
              </PublicOnlyRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
