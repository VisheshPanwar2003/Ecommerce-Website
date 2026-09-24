import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSellerOrder, updateSellerOrderStatus, getSellerDashboard } from '../../services/sellerService.js';
import { useToast } from '../../components/common/Toast.jsx';
import SellerNavHeader from './SellerNavHeader.jsx';

export const SellerOrderDetailPage = () => {
  const { id } = useParams();
  const { addToast } = useToast();

  const [order, setOrder] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderData, dashboard] = await Promise.all([
        getSellerOrder(id),
        getSellerDashboard().catch(() => null)
      ]);
      setOrder(orderData);
      setDashboardData(dashboard);
    } catch (err) {
      console.error('Failed to load seller order detail:', err);
      const msg =
        err.response?.status === 403
          ? 'Forbidden: You do not have permission to view or manage this order. It belongs to another merchant.'
          : err.response?.data?.message || 'Failed to load order details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const updated = await updateSellerOrderStatus(id, newStatus);
      setOrder(updated);
      addToast(`Order status updated to ${newStatus}`, 'success');
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to update order status:', err);
      addToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  const storeInfo = dashboardData?.store || {
    storeName: 'Merchant Console',
    status: 'ACTIVE'
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
        <p className="text-xs font-medium text-neutral-500">Loading order fulfillment details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <SellerNavHeader />
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-base font-bold text-rose-900 mb-1">Access Rejected</h2>
          <p className="text-xs text-rose-700 mb-4">{error || 'Order not found.'}</p>
          <Link
            to="/seller/orders"
            className="inline-flex items-center px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ← Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const allowedTransitions = order.allowedTransitions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation Header */}
      <SellerNavHeader
        storeName={storeInfo.storeName}
        storeStatus={storeInfo.status}
      />

      {/* Breadcrumb / Title Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <Link to="/seller/orders" className="hover:text-neutral-900 underline">
              Orders
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium font-mono">
              #{order.id.slice(0, 8)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            <span>Order #{order.id.slice(0, 8)}</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${getStatusBadge(
                order.orderStatus
              )}`}
            >
              {order.orderStatus}
            </span>
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
          </p>
        </div>

        <Link
          to="/seller/orders"
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          ← All Orders
        </Link>
      </div>

      {/* Multi-Vendor Alert Banner */}
      {order.isMultiVendor && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800 flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <div className="font-semibold text-amber-900 mb-0.5">
              Multi-Vendor Marketplace Order
            </div>
            <p className="leading-relaxed">
              This order contains products from multiple independent sellers. You are viewing only
              the items, quantity, and subtotal belonging to your store. In accordance with marketplace
              isolation rules, global order status transitions are restricted on multi-vendor orders to
              prevent modifying another merchant's fulfillment scope.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Items & Fulfillment Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider mb-4 border-b border-neutral-100 pb-2">
              Your Order Items
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-mono uppercase text-neutral-500">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900">
                          {item.productName}
                        </div>
                        {item.variantName && (
                          <div className="text-[11px] text-neutral-500">
                            Variant: {item.variantName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600">
                        {item.sku}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-neutral-800">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-neutral-800 font-semibold">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-neutral-900 font-bold">
                        ${Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-200 text-xs font-mono">
                    <td colSpan={3} className="py-3 px-3 font-bold text-neutral-700">
                      Your Store Subtotal ({order.totalQuantity} units)
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right font-bold text-neutral-900 text-sm">
                      ${Number(order.sellerSubtotal).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fulfillment Status Actions */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider mb-2 border-b border-neutral-100 pb-2">
              Fulfillment Controls
            </h3>

            {order.orderStatus === 'DELIVERED' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  This order has been marked as <strong>DELIVERED</strong>. The fulfillment lifecycle is complete.
                </span>
              </div>
            ) : order.orderStatus === 'CANCELLED' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>
                  This order has been <strong>CANCELLED</strong>. Associated product inventory was safely restored.
                </span>
              </div>
            ) : order.isMultiVendor ? (
              <p className="text-xs text-neutral-500">
                Fulfillment actions are disabled for shared multi-vendor orders to protect each merchant's autonomy.
              </p>
            ) : allowedTransitions.length === 0 ? (
              <p className="text-xs text-neutral-500">No further status transitions are available for this order.</p>
            ) : (
              <div>
                <p className="text-xs text-neutral-600 mb-4">
                  Progress this order through the authorized fulfillment lifecycle:
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {allowedTransitions.includes('CONFIRMED') && (
                    <button
                      type="button"
                      id="status-btn-confirm"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('CONFIRMED')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                    >
                      {updatingStatus ? 'Updating...' : 'Confirm Order'}
                    </button>
                  )}

                  {allowedTransitions.includes('PROCESSING') && (
                    <button
                      type="button"
                      id="status-btn-process"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('PROCESSING')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                    >
                      {updatingStatus ? 'Updating...' : 'Start Processing'}
                    </button>
                  )}

                  {allowedTransitions.includes('SHIPPED') && (
                    <button
                      type="button"
                      id="status-btn-ship"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('SHIPPED')}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark as Shipped'}
                    </button>
                  )}

                  {allowedTransitions.includes('DELIVERED') && (
                    <button
                      type="button"
                      id="status-btn-deliver"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('DELIVERED')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark as Delivered'}
                    </button>
                  )}

                  {allowedTransitions.includes('CANCELLED') && (
                    <button
                      type="button"
                      id="status-btn-cancel"
                      disabled={updatingStatus}
                      onClick={() => setShowCancelModal(true)}
                      className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Delivery Information */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 uppercase font-mono tracking-wider mb-4 border-b border-neutral-100 pb-2">
              Delivery Information
            </h3>

            {order.shippingAddress ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Recipient
                  </span>
                  <div className="font-semibold text-neutral-900 mt-0.5">
                    {order.shippingAddress.fullName || 'Customer'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Contact Phone
                  </span>
                  <div className="font-mono text-neutral-800 mt-0.5">
                    {order.shippingAddress.phone || '—'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Shipping Address
                  </span>
                  <div className="text-neutral-800 mt-0.5 leading-relaxed">
                    {order.shippingAddress.addressLine}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Payment Status
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">No delivery address recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">Cancel Order</h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Are you sure you want to cancel this order? This action will mark the order as
              <strong> CANCELLED</strong> and automatically restore inventory quantities for the affected items.
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={updatingStatus}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('CANCELLED')}
                disabled={updatingStatus}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                {updatingStatus ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrderDetailPage;
