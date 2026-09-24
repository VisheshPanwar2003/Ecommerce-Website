import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartWishlistProvider } from './context/CartWishlistContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import Layout from './components/layout/Layout.jsx';
import ShopPage from './pages/shop/ShopPage.jsx';
import ProductDetailsPage from './pages/shop/ProductDetailsPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartWishlistProvider>
          <ToastProvider>
            <Layout>
              <Routes>
                {/* Default route redirects to /shop */}
                <Route path="/" element={<Navigate to="/shop" replace />} />
                
                {/* Main Product Catalogue / Discovery Console */}
                <Route path="/shop" element={<ShopPage />} />

                {/* Product Details Page */}
                <Route path="/product/:id" element={<ProductDetailsPage />} />
                <Route path="/products/:id" element={<Navigate to="/product/:id" replace />} />

                {/* Fallback 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="py-20 text-center">
                      <div className="font-mono text-xs text-neutral-400 mb-2">404 / NOT FOUND</div>
                      <h2 className="text-xl font-bold text-neutral-900 mb-4">Page not found</h2>
                      <Navigate to="/shop" replace />
                    </div>
                  }
                />
              </Routes>
            </Layout>
          </ToastProvider>
        </CartWishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
