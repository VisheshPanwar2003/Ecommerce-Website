import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSellerDashboard } from '../../services/sellerService.js';

export const SellerDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'inventory' | 'orders'

  // Filters for sub-tables
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSellerDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load seller dashboard:', err);
      setError(err.userMessage || 'Failed to load merchant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    return data.products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesStatus =
        productStatusFilter === 'ALL' || p.status === productStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.products, productSearch, productStatusFilter]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    if (!data?.inventory) return [];
    return data.inventory.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
        item.productSku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (item.variantSku && item.variantSku.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesStatus =
        inventoryStatusFilter === 'ALL' || item.stockStatus === inventoryStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.inventory, productSearch, inventoryStatusFilter]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    return data.recentOrders.filter((order) => {
      return (
        order.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.productName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.sku.toLowerCase().includes(orderSearch.toLowerCase())
      );
    });
  }, [data?.recentOrders, orderSearch]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="h-6 w-48 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-neutral-100 rounded"></div>
          </div>
          <div className="h-9 w-28 bg-neutral-200 rounded"></div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 my-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl border border-neutral-200 p-4">
              <div className="h-3 w-16 bg-neutral-200 rounded mb-2"></div>
              <div className="h-6 w-20 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="h-96 bg-neutral-100 rounded-xl border border-neutral-200 p-6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Unable to Load Dashboard</h2>
        <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-brand-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { seller, metrics } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Merchant Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-neutral-500">
              Merchant Portal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {seller?.status || 'ACTIVE'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {seller?.storeName || 'Merchant Store'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Store ID: <span className="font-mono text-neutral-700">{seller?.id}</span> • Managed by {user?.name || seller?.ownerName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
            title="Refresh dashboard metrics"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Refresh
          </button>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <span>Customer View</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Metric Cards (1. Overview Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 my-6">
        {/* Total Products */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:border-neutral-300 transition-colors">
          <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
            Total Products
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {metrics?.totalProducts ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Catalog items</div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:border-neutral-300 transition-colors">
          <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
            Active
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {metrics?.activeProducts ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Published live</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:border-neutral-300 transition-colors">
          <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
            Low Stock
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              (metrics?.lowStockProducts ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-900'
            }`}
          >
            {metrics?.lowStockProducts ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">≤ 5 units left</div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:border-neutral-300 transition-colors">
          <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
            Orders
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {metrics?.totalOrders ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Unique checkouts</div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:border-neutral-300 transition-colors">
          <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
            Pending
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              (metrics?.pendingOrders ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-900'
            }`}
          >
            {metrics?.pendingOrders ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Awaiting fulfill</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:border-neutral-300 transition-colors">
          <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
            Revenue
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 truncate">
            ₹{metrics?.totalRevenue ? Number(metrics.totalRevenue).toLocaleString() : '0'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Store items total</div>
        </div>
      </div>

      {/* Navigation Tabs (5. Seller Navigation) */}
      <div className="flex border-b border-neutral-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Overview Console
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>Products</span>
          <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono text-neutral-600">
            {data?.products?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>Inventory Monitor</span>
          {(metrics?.lowStockProducts ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>Recent Orders</span>
          <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono text-neutral-600">
            {data?.recentOrders?.length || 0}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Product & Inventory Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products Quick View */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-900">Your Store Products</h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs text-neutral-600 hover:text-neutral-950 font-medium"
                >
                  View All &rarr;
                </button>
              </div>

              {data?.products?.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No products published yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {data.products.slice(0, 5).map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 truncate pr-4">
                        <div className="w-8 h-8 rounded bg-neutral-100 flex-shrink-0 flex items-center justify-center font-mono text-[10px] text-neutral-400">
                          {p.sku.slice(0, 3)}
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-neutral-900 truncate">{p.name}</div>
                          <div className="font-mono text-[10px] text-neutral-400">
                            {p.sku} {p.category?.name ? `• ${p.category.name}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-medium text-neutral-900">
                          ₹{p.price.toFixed(2)}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Alerts View */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">Inventory Status</h3>
                  {(metrics?.lowStockProducts ?? 0) > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {metrics.lowStockProducts} Low / Out
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs text-neutral-600 hover:text-neutral-950 font-medium"
                >
                  Monitor &rarr;
                </button>
              </div>

              {data?.inventory?.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No inventory tracking records available.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {data.inventory.slice(0, 5).map((inv, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {inv.productName} {inv.variantName ? `(${inv.variantName})` : ''}
                        </div>
                        <div className="font-mono text-[10px] text-neutral-400">
                          SKU: {inv.variantSku || inv.productSku}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-neutral-900">
                          {inv.currentStock} units
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            inv.stockStatus === 'Out of Stock'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                              : inv.stockStatus === 'Low Stock'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {inv.stockStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Recent Customer Orders</h3>
                <p className="text-[11px] text-neutral-500">
                  Showing order items belonging strictly to your store
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-neutral-600 hover:text-neutral-950 font-medium"
              >
                View All Orders &rarr;
              </button>
            </div>

            {data?.recentOrders?.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No orders have been placed for your store yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 font-mono text-neutral-500">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Your Revenue</th>
                      <th className="py-2.5 px-3">Order Status</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 truncate max-w-[120px]">
                          {order.orderId.slice(0, 8)}...
                        </td>
                        <td className="py-2.5 px-3 font-medium text-neutral-900">
                          {order.productName} {order.variantName ? `(${order.variantName})` : ''}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{order.quantity}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">
                          ₹{order.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                              order.orderStatus === 'CONFIRMED' || order.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : order.orderStatus === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 font-mono text-[11px]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PRODUCTS (2. Product Summary) */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Store Products</h2>
              <p className="text-xs text-neutral-500">
                Products registered and maintained under your merchant account
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products or SKU..."
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-48 sm:w-64 focus:outline-none focus:border-neutral-900"
              />
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700 focus:outline-none focus:border-neutral-900"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-500">
              No products found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-mono text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Base Price</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-3 font-medium text-neutral-900">
                        {p.name}
                        {p.hasVariants && (
                          <span className="ml-2 text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                            {p.variantCount} variants
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-500 text-[11px]">{p.sku}</td>
                      <td className="py-3 px-3 text-neutral-600">{p.category?.name || '—'}</td>
                      <td className="py-3 px-3 font-mono font-medium text-neutral-900">
                        ₹{p.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {p.hasVariants ? (
                          <span className="text-neutral-500">See variants</span>
                        ) : (
                          `${p.stock} units`
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-500 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/product/${p.id}`}
                          className="text-neutral-600 hover:text-neutral-950 underline font-medium text-[11px]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INVENTORY (3. Inventory Summary) */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Inventory Status Monitor</h2>
              <p className="text-xs text-neutral-500">
                Track available stock units for products and product variants
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700 focus:outline-none focus:border-neutral-900"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="In Stock">In Stock (&gt; 5)</option>
                <option value="Low Stock">Low Stock (1 – 5)</option>
                <option value="Out of Stock">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-500">
              No inventory items matching filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-mono text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-3">Item / Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Stock Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-3 font-medium text-neutral-900">
                        {item.productName}
                        {item.variantName && (
                          <span className="text-neutral-500 ml-1 font-normal">
                            ({item.variantName})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-500">
                        {item.variantSku || item.productSku}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {item.isVariant ? 'Variant unit' : 'Standard product'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-neutral-900">
                        {item.currentStock} units
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono border ${
                            item.stockStatus === 'Out of Stock'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                              : item.stockStatus === 'Low Stock'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ORDERS (4. Recent Orders) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Merchant Order Ledger</h2>
              <p className="text-xs text-neutral-500">
                Audited order items containing goods fulfilled by your store
              </p>
            </div>

            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by order ID or product..."
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-56 sm:w-64 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-500">
              No orders found matching search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-mono text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Item Revenue</th>
                    <th className="py-2.5 px-3">Order Status</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Ordered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 truncate max-w-[140px]">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-900">
                        {order.productName}
                        {order.variantName && (
                          <span className="text-neutral-500 ml-1 font-normal">
                            ({order.variantName})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-500">{order.sku}</td>
                      <td className="py-3 px-3 font-mono">{order.quantity}</td>
                      <td className="py-3 px-3 font-mono">₹{order.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-neutral-900">
                        ₹{order.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                            order.orderStatus === 'CONFIRMED' || order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.orderStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-600">{order.location || '—'}</td>
                      <td className="py-3 px-3 text-neutral-500 font-mono text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerDashboardPage;
