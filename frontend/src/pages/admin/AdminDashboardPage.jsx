import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/adminService.js';
import AdminNavHeader from './AdminNavHeader.jsx';

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDashboard();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load platform dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getOrderStatusBadge = (status) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminNavHeader />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Platform Operations & Metrics
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time platform-wide activity, account health, catalog status, and order tracking.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
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
          Refresh Metrics
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Aggregating platform metrics...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-rose-800 mb-3">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Users Metric Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  Total Users
                </span>
                <Link
                  to="/admin/users"
                  className="text-[10px] font-mono text-neutral-400 hover:text-neutral-900 underline"
                >
                  Manage →
                </Link>
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 mb-3">
                {metrics?.users?.total || 0}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {metrics?.users?.active || 0} Active
                </span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {metrics?.users?.suspended || 0} Suspended
                </span>
              </div>
            </div>

            {/* Sellers Metric Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  Total Sellers
                </span>
                <Link
                  to="/admin/sellers"
                  className="text-[10px] font-mono text-neutral-400 hover:text-neutral-900 underline"
                >
                  Manage →
                </Link>
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 mb-3">
                {metrics?.sellers?.total || 0}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {metrics?.sellers?.active || 0} Active
                </span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {metrics?.sellers?.suspended || 0} Suspended
                </span>
              </div>
            </div>

            {/* Products Metric Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  Catalog Products
                </span>
                <Link
                  to="/admin/products"
                  className="text-[10px] font-mono text-neutral-400 hover:text-neutral-900 underline"
                >
                  Moderate →
                </Link>
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 mb-3">
                {metrics?.products?.total || 0}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {metrics?.products?.active || 0} Active
                </span>
                <span className="text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  {metrics?.products?.inactive || 0} Inactive
                </span>
              </div>
            </div>

            {/* Orders Metric Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  Total Orders
                </span>
                <Link
                  to="/admin/orders"
                  className="text-[10px] font-mono text-neutral-400 hover:text-neutral-900 underline"
                >
                  Overview →
                </Link>
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 mb-3">
                {metrics?.orders?.total || 0}
              </div>
              <div className="text-[11px] font-mono text-neutral-500">
                Marketplace-wide customer orders
              </div>
            </div>
          </div>

          {/* Orders Pipeline Breakdown */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider mb-4 border-b border-neutral-100 pb-2">
              Order Fulfillment Pipeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-amber-700">Pending</div>
                <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                  {metrics?.orders?.pending || 0}
                </div>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-blue-700">Confirmed</div>
                <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                  {metrics?.orders?.confirmed || 0}
                </div>
              </div>
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-indigo-700">Processing</div>
                <div className="text-xl font-bold font-mono text-indigo-900 mt-1">
                  {metrics?.orders?.processing || 0}
                </div>
              </div>
              <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-sky-700">Shipped</div>
                <div className="text-xl font-bold font-mono text-sky-900 mt-1">
                  {metrics?.orders?.shipped || 0}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-emerald-700">Delivered</div>
                <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
                  {metrics?.orders?.delivered || 0}
                </div>
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-rose-700">Cancelled</div>
                <div className="text-xl font-bold font-mono text-rose-900 mt-1">
                  {metrics?.orders?.cancelled || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider">
                  Recent Marketplace Orders
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Latest activity across all sellers and buyers.
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-neutral-900 hover:underline"
              >
                View All Orders →
              </Link>
            </div>

            {!metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
              <p className="text-center py-6 text-xs text-neutral-400">
                No orders have been placed on the marketplace yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-mono uppercase text-neutral-500">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Units</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {metrics.recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">
                          #{o.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-neutral-800">
                          {o.customerName}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 text-[11px]">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700">
                          {o.itemCount}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-neutral-900">
                          ${Number(o.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getOrderStatusBadge(
                              o.orderStatus
                            )}`}
                          >
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="text-[11px] text-neutral-700 hover:text-neutral-900 font-medium underline"
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
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
