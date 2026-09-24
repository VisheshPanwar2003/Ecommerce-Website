import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import checkoutService from '../../services/checkoutService.js';
import { useCartWishlist } from '../../context/CartWishlistContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';

export const CheckoutPage = () => {
  const { user, isAuthenticated, promptLogin } = useAuth();
  const { refreshCart } = useCartWishlist();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // Shipping & Placing order
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const loadSummary = async (code = appliedCouponCode) => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkoutService.getCheckoutSummary(code || null);
      setSummary(data);
      if (data?.coupon?.code) {
        setAppliedCouponCode(data.coupon.code);
      } else if (!code) {
        setAppliedCouponCode('');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load checkout summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      promptLogin('Please sign in to proceed to checkout');
      return;
    }
    loadSummary('');
  }, [isAuthenticated]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    setCouponError(null);

    const cleanCode = couponInput.trim().toUpperCase();
    try {
      const data = await checkoutService.getCheckoutSummary(cleanCode);
      setSummary(data);
      if (data?.coupon?.code) {
        setAppliedCouponCode(data.coupon.code);
        setCouponInput('');
        addToast(`Coupon "${data.coupon.code}" applied successfully!`, 'success');
      } else {
        setCouponError('Coupon could not be applied');
      }
    } catch (err) {
      setCouponError(err.userMessage || 'Invalid or inapplicable coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponError(null);
    setAppliedCouponCode('');
    setCouponInput('');
    await loadSummary('');
    addToast('Coupon removed', 'info');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!summary || !summary.canCheckout || summary.items?.length === 0) {
      addToast('Cannot checkout: some items are unavailable', 'error');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderPayload = {
        couponCode: appliedCouponCode || undefined,
        shippingAddress
      };
      const order = await checkoutService.createOrder(orderPayload);
      setOrderSuccess(order);
      await refreshCart();
      addToast('Order placed successfully!', 'success');
    } catch (err) {
      addToast(err.userMessage || 'Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Order Confirmed!</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Order ID: <span className="font-mono font-semibold text-neutral-800">{orderSuccess.id}</span>
        </p>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-left mb-8 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal:</span>
            <span>₹{orderSuccess.subtotal}</span>
          </div>
          {Number(orderSuccess.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Coupon Discount:</span>
              <span>-₹{orderSuccess.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Shipping:</span>
            <span>₹{orderSuccess.shipping}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-neutral-900">
            <span>Total Paid:</span>
            <span>₹{orderSuccess.total}</span>
          </div>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center px-6 py-3 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg font-mono transition-colors shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-neutral-200 rounded"></div>
        <div className="h-40 bg-neutral-100 rounded-xl"></div>
      </div>
    );
  }

  const items = summary?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Checkout & Order Review</h1>
        <p className="text-xs text-neutral-500 mt-1">Review your cart items, apply discount coupons, and finalize your purchase.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadSummary('')} className="underline font-mono">Retry</button>
        </div>
      )}

      {isEmpty ? (
        <div className="p-12 border border-dashed border-neutral-300 rounded-2xl text-center space-y-4 bg-neutral-50/50">
          <p className="text-sm font-medium text-neutral-700">Your cart is currently empty.</p>
          <Link
            to="/shop"
            className="inline-flex items-center px-4 py-2 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg font-mono transition-colors"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cart Items & Shipping Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Items list */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase font-mono tracking-wider">
                Order Items ({items.length})
              </h2>

              <div className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <div key={item.cartItemId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-neutral-900">{item.name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        Qty: {item.quantity} &bull; ₹{item.unitPrice} each
                        {item.seller?.name && ` &bull; Seller: ${item.seller.name}`}
                      </div>
                      {!item.isAvailable && (
                        <div className="text-rose-600 font-mono text-[10px] mt-0.5">
                          Unavailable: {item.availabilityReason}
                        </div>
                      )}
                    </div>
                    <div className="font-mono font-semibold text-neutral-900">
                      ₹{item.subtotal}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details Form */}
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase font-mono tracking-wider">
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-neutral-600 mb-1">Address Line</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.addressLine}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine: e.target.value })}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & Coupon Module (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Coupon Application Box */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase font-mono tracking-wider">
                Discount Coupon
              </h2>

              {appliedCouponCode ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-mono font-bold text-xs text-emerald-800">
                      {appliedCouponCode}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-mono">
                      (Saved ₹{summary?.discount})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-mono text-rose-600 hover:text-rose-800 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="ENTER COUPON CODE"
                      className="flex-1 text-xs p-2.5 uppercase font-mono border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-mono rounded-lg disabled:opacity-40 transition-colors"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </form>
              )}

              {couponError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {couponError}
                </div>
              )}
            </div>

            {/* Authoritative Order Calculation Summary */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-3">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase font-mono tracking-wider mb-2">
                Order Summary
              </h2>

              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-neutral-900">₹{summary?.subtotal}</span>
              </div>

              {Number(summary?.discount) > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCouponCode})</span>
                  <span className="font-mono">-₹{summary?.discount}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-neutral-600">
                <span>Estimated Shipping</span>
                <span className="font-mono font-medium text-neutral-900">
                  {Number(summary?.shipping) === 0 ? 'FREE' : `₹${summary?.shipping}`}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-neutral-900">Final Total</span>
                <span className="text-xl font-bold font-mono text-neutral-900">₹{summary?.total}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={placingOrder || !summary?.canCheckout}
                className="w-full mt-4 py-3 px-4 bg-brand-900 hover:bg-black text-white text-xs font-medium font-mono uppercase tracking-wider rounded-lg disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {placingOrder ? 'Processing Order...' : 'Place Order & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
