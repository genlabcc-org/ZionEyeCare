import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import { useStore } from './hooks/useStore';
import HomePage from "./pages/HomePage";

const SignupPage = lazy(() => import("./pages/SignupPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OtpVerifyPage = lazy(() => import("./pages/OtpVerifyPage"));
const Profile = lazy(() => import("./profile/Profile"));
const Orders = lazy(() => import("./profile/Orders"));
const OrderTracking = lazy(() => import("./profile/OrderTracking"));
const Addresses = lazy(() => import("./profile/Addresses"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));

const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const AdminRoute = lazy(() => import("./components/AdminRoute"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
);

// Scrolls to top on every route change, or scrolls to hash element if specified
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

// Custom Category / Products Page
function CategoryBySlug() {
  const { slug } = useParams();
  const categories = useStore(state => state.categories);
  const fetchCategories = useStore(state => state.fetchCategories);

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchCategories().finally(() => setChecked(true));
  }, [fetchCategories]);

  const rawSlug = decodeURIComponent(slug || '');
  const normalizedSlug = rawSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (normalizedSlug === 'new-arrivals') {
    return <Navigate to="/#new-arrivals" replace />;
  }
  if (normalizedSlug === 'best-sellers') {
    return <Navigate to="/all-products" replace />;
  }
  if (normalizedSlug === 'all' || normalizedSlug === 'all-products' || normalizedSlug === 'products') {
    return <ProductPage category="All Products" />;
  }

  const match = categories.find(
    c => c.slug === slug ||
      c.slug === normalizedSlug ||
      (c.name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === normalizedSlug
  );

  if (!checked) {
    return null;
  }

  if (match) {
    return <ProductPage category={match.name} />;
  }

  return <NotFoundPage />;
}

function App() {
  const initAuth = useStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id/*" element={<ProductDetailsPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/products/:id/*" element={<ProductDetailsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/product" element={<ProductDetailsPage />} />
          <Route path="/all-products" element={<ProductPage category="All Products" />} />
          <Route path="/products" element={<ProductPage category="All Products" />} />
          <Route path="/category/all" element={<ProductPage category="All Products" />} />

          <Route path="/category/:slug" element={<CategoryBySlug />} />
          <Route path="/:slug" element={<CategoryBySlug />} />

          <Route path="/account/login" element={<LoginPage />} />
          <Route path="/account/signup" element={<SignupPage />} />
          <Route path="/account/otp-verify" element={<OtpVerifyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp-verify" element={<OtpVerifyPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<CartPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/orders" element={<Orders />} />
          <Route path="/profile/orders/track/:orderId" element={<OrderTracking />} />
          <Route path="/track-order/:orderId" element={<OrderTracking />} />
          <Route path="/profile/addresses" element={<Addresses />} />
          <Route path="/profile/account" element={<Navigate to="/profile" replace />} />

          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route path="/cart" element={<CartPage />} />

          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />

          {/* Catch-all 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
