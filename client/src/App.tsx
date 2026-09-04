import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { BusinessNavbar } from './components/business/BusinessNavbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AiShoppingAssistantDrawer } from './components/ai-assistant/AiShoppingAssistantDrawer';
import { BusinessRestrictedModal } from './components/BusinessRestrictedModal';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BusinessHomePage } from './pages/business/BusinessHomePage';
import { BusinessLoginPage } from './pages/business/BusinessLoginPage';
import { BusinessRegisterPage } from './pages/business/BusinessRegisterPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CompanyStorePage } from './pages/CompanyStorePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminMerchantsPage } from './pages/admin/AdminMerchantsPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { BusinessLayout } from './pages/business/BusinessLayout';
import { BusinessProductsPage } from './pages/business/BusinessProductsPage';
import { BusinessOrdersPage } from './pages/business/BusinessOrdersPage';
import { BusinessStorefrontPage } from './pages/business/BusinessStorefrontPage';
import { DealsPage } from './pages/DealsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isBusiness = location.pathname.startsWith('/business');
  const isAdmin = location.pathname.startsWith('/admin');
  const isBusinessAuth = location.pathname === '/business/login' || location.pathname === '/business/register';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/60 text-zinc-900">
      {!isBusiness && !isAdmin && <Navbar />}
      {isBusinessAuth && <BusinessNavbar />}
      <CartDrawer />
      <WishlistDrawer />
      <NotificationDrawer />
      <AiShoppingAssistantDrawer />
      <BusinessRestrictedModal />
      <div className="flex-1">
        <Routes>
          {/* Public Storefront Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/wishlist/shared/:shareToken" element={<WishlistPage />} />
          <Route path="/store/:companyIdentifier" element={<CompanyStorePage />} />
          <Route path="/company/:companyIdentifier" element={<CompanyStorePage />} />

          {/* Dedicated Modular Admin Platform Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminOverviewPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/merchants"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminMerchantsPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminProductsPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminOrdersPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/system"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminSystemPage />
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Customer Profile & Checkout Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />
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

          {/* Dedicated Modular Business / Merchant Routes */}
          <Route path="/business" element={<BusinessHomePage />} />
          <Route
            path="/business/products"
            element={
              <BusinessLayout>
                <BusinessProductsPage />
              </BusinessLayout>
            }
          />
          <Route
            path="/business/orders"
            element={
              <BusinessLayout>
                <BusinessOrdersPage />
              </BusinessLayout>
            }
          />
          <Route
            path="/business/storefront"
            element={
              <BusinessLayout>
                <BusinessStorefrontPage />
              </BusinessLayout>
            }
          />
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

          {/* Fallback 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!isBusiness && !isAdmin && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
