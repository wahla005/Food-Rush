import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Auth pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OtpPage from './pages/OtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// App pages
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantPage from './pages/RestaurantPage';
import FoodDetailsPage from './pages/FoodDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';

// ── Guard ──────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

// ── Routes ──────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Default */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* User auth */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/verify-otp" element={<OtpPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

    {/* User app */}
    <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
    <Route path="/menu" element={<PrivateRoute><MenuPage /></PrivateRoute>} />
    <Route path="/restaurants" element={<PrivateRoute><RestaurantsPage /></PrivateRoute>} />
    <Route path="/restaurant/:id" element={<PrivateRoute><RestaurantPage /></PrivateRoute>} />
    <Route path="/food/:id" element={<PrivateRoute><FoodDetailsPage /></PrivateRoute>} />
    <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
    <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
    <Route path="/order-confirmation" element={<PrivateRoute><OrderConfirmationPage /></PrivateRoute>} />
    <Route path="/orders" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} />
    <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ style: { fontFamily: "'Inter', sans-serif", fontSize: '14px' } }} />
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
);

export default App;


