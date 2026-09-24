import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminOrder } from '../../services/adminService.js';
import AdminNavHeader from './AdminNavHeader.jsx';

export const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminOrder(id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load admin order detail:', err);
      setError(err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

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

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REFUNDED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminNavHeader />
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Loading order breakdown...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminNavHeader />
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center max-w-xl mx-auto mt-8">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-rose-900 mb-1">Order Not Found</h2>
          <p className="text-xs text-rose-700 mb-4">{error || 'Unable to retrieve order details.'}</p>
          <Link
            to="/admin/orders"
            className="inline-flex items-center px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ← Back to Marketplace Orders
          </Link>
        </div>
      </div>
    );
  }

  // Calculate unique participating sellers
  const participatingSellers = [];
  const sellerMap = new Map();
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item) => {
      if (item.seller && !sellerMap.has(item.seller.id)) {
        sellerMap.set(item.seller.id, true);
        participatingSellers.push(item.seller);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <AdminNavHeader />

      {/* Header and Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <Link to="/admin/orders" className="hover:text-neutral-900 underline">
              Marketplace Orders
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-mono font-medium">#{order.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 font-mono">
              Order #{order.id.slice(0, 8)}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${getOrderStatusBadge(order.status)}`}>
              {order.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${getPaymentStatusBadge(order.paymentStatus)}`}>
              Payment: {order.paymentStatus || 'PENDING'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            ID: {order.id} • Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <Link
          to="/admin/orders"
          className="text-xs font-medium text-neutral-700 hover:text-neutral-950 px-3.5 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors self-start sm:self-auto"
        >
          ← Back to Orders
        </Link>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Customer</h3>
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900">{order.user?.name || 'Guest / Unnamed'}</div>
            <div className="text-xs font-mono text-neutral-500">{order.user?.email || 'No email provided'}</div>
            <div className="text-[11px] font-mono text-neutral-400 mt-1">User ID: {order.userId}</div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Shipping Address</h3>
          </div>
          {order.address ? (
            <div className="text-xs text-neutral-700 space-y-0.5">
              <div className="font-semibold text-neutral-900">{order.address.fullName || order.user?.name}</div>
              <div>{order.address.street || order.address.addressLine1}</div>
              {order.address.addressLine2 && <div>{order.address.addressLine2}</div>}
              <div>
                {order.address.city}, {order.address.state} {order.address.postalCode}
              </div>
              <div>{order.address.country}</div>
              {order.address.phone && <div className="text-neutral-500 font-mono mt-1">Tel: {order.address.phone}</div>}
            </div>
          ) : (
            <div className="text-xs text-neutral-400 italic">No delivery address attached.</div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Financial Summary</h3>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-mono text-neutral-900">
                ${order.items?.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0).toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-mono font-medium text-neutral-900">{order.status}</span>
            </div>
            <div className="pt-2 border-t border-neutral-100 flex justify-between font-bold text-sm text-neutral-900">
              <span>Marketplace Total</span>
              <span className="font-mono">${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Participating Merchants */}
      {participatingSellers.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
            Participating Merchants ({participatingSellers.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {participatingSellers.map((seller) => (
              <div
                key={seller.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{seller.storeName}</span>
                <span className="text-[10px] font-mono text-neutral-400">({seller.id.slice(0, 8)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ordered Line Items */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">
            Ordered Line Items ({order.items?.length || 0})
          </h2>
          <span className="text-xs text-neutral-500 font-mono">Marketplace Fulfillment Overview</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-600">
              <tr>
                <th className="py-3 px-6">Product & Details</th>
                <th className="py-3 px-6">Fulfilling Seller</th>
                <th className="py-3 px-6 text-right">Unit Price</th>
                <th className="py-3 px-6 text-center">Quantity</th>
                <th className="py-3 px-6 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  const lineTotal = Number(item.price) * item.quantity;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900">
                          {item.product?.name || 'Product'}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 space-x-2">
                          <span>SKU: {item.product?.sku || item.variant?.sku || 'N/A'}</span>
                          {item.variant && <span>• Variant: {item.variant.name || item.variant.title}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-neutral-800">
                          {item.seller?.storeName || 'Unknown Merchant'}
                        </div>
                        <div className="text-xs font-mono text-neutral-400">
                          ID: {item.sellerId ? item.sellerId.slice(0, 8) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-neutral-700">
                        ${Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-medium text-neutral-900">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-neutral-900">
                        ${lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs text-neutral-400">
                    No items in this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
