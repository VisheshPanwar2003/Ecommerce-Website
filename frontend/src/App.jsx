import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartWishlistProvider } from './context/CartWishlistContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import Layout from './components/layout/Layout.jsx';
import ShopPage from './pages/shop/ShopPage.jsx';
import ProductDetailsPage from './pages/shop/ProductDetailsPage.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import SellerDashboardPage from './pages/seller/SellerDashboardPage.jsx';
import SellerProductsPage from './pages/seller/SellerProductsPage.jsx';
import SellerProductFormPage from './pages/seller/SellerProductFormPage.jsx';
import SellerInventoryPage from './pages/seller/SellerInventoryPage.jsx';
import SellerOrdersPage from './pages/seller/SellerOrdersPage.jsx';
import SellerOrderDetailPage from './pages/seller/SellerOrderDetailPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminSellersPage from './pages/admin/AdminSellersPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage.jsx';
import AdminCouponsPage from './pages/admin/AdminCouponsPage.jsx';
import CheckoutPage from './pages/shop/CheckoutPage.jsx';

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

                {/* Checkout & Cart Page */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/cart" element={<Navigate to="/checkout" replace />} />

                {/* Seller Management Portal */}
                <Route
                  path="/seller"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/products"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/products/new"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerProductFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/products/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerProductFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerInventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/orders"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                      <SellerOrderDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Management Portal */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sellers"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminSellersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminCategoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminOrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/coupons"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminCouponsPage />
                    </ProtectedRoute>
                  }
                />

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
