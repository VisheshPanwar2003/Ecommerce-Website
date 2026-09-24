import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSellerOrders, getSellerDashboard } from '../../services/sellerService.js';
import SellerNavHeader from './SellerNavHeader.jsx';

export const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, dashboard] = await Promise.all([
        getSellerOrders(),
        getSellerDashboard().catch(() => null)
      ]);
      setOrders(ordersData);
      setDashboardData(dashboard);
    } catch (err) {
      console.error('Failed to load seller orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SHIPPED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PROCESSING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchTarget = `${order.id} ${order.customerName || ''} ${order.location || ''} ${(order.items || []).map((i) => i.productName).join(' ')}`.toLowerCase();
      const matchesSearch = !searchTerm.trim() || searchTarget.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const storeInfo = dashboardData?.store || {
    storeName: 'Merchant Console',
    status: 'ACTIVE'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Header */}
      <SellerNavHeader
        storeName={storeInfo.storeName}
        storeStatus={storeInfo.status}
      />

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Order Fulfillment
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track customer orders containing your products, inspect items, and update fulfillment progress.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors self-start sm:self-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Orders
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            id="order-search-input"
            placeholder="Search by Order ID, product, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-neutral-50 focus:bg-white transition-colors"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-neutral-500 whitespace-nowrap">Filter:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
            {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                id={`filter-order-${st.toLowerCase()}`}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Loading your store's customer orders...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-rose-800 mb-3">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-neutral-900 mb-1">No orders yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
            When customers purchase your products, their orders will appear here for fulfillment.
          </p>
          <Link
            to="/seller/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Manage Products
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-xs text-neutral-500 mb-2">
            No orders match the selected status filter or search query.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="text-xs text-neutral-900 font-semibold underline hover:no-underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Delivery Location</th>
                  <th className="py-3 px-4">Your Products</th>
                  <th className="py-3 px-4">Units</th>
                  <th className="py-3 px-4">Your Subtotal</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredOrders.map((order) => {
                  const itemsCount = order.items ? order.items.length : 0;
                  const firstItem = order.items?.[0];

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/seller/orders/${order.id}`}
                          className="font-mono font-semibold text-neutral-900 hover:underline"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-neutral-800 font-medium">
                          {order.location || 'Local Delivery'}
                        </div>
                        {order.customerName && (
                          <div className="text-[11px] text-neutral-400">
                            Attn: {order.customerName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {firstItem && (
                          <div>
                            <span className="font-semibold text-neutral-900">
                              {firstItem.productName}
                            </span>
                            {firstItem.variantName && (
                              <span className="text-[10px] text-neutral-500 ml-1">
                                ({firstItem.variantName})
                              </span>
                            )}
                          </div>
                        )}
                        {itemsCount > 1 && (
                          <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                            + {itemsCount - 1} more item{itemsCount > 2 ? 's' : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-800">
                        {order.totalQuantity} units
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                        ${Number(order.sellerSubtotal).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getStatusBadge(
                              order.orderStatus
                            )}`}
                          >
                            {order.orderStatus}
                          </span>
                          {order.isMultiVendor && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              Multi-Vendor
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/seller/orders/${order.id}`}
                          id={`view-order-${order.id.slice(0, 8)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-lg transition-colors"
                        >
                          <span>Manage</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
