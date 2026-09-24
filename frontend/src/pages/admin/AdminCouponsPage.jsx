import React, { useState, useEffect } from 'react';
import AdminNavHeader from './AdminNavHeader.jsx';
import adminService from '../../services/adminService.js';
import { useToast } from '../../components/common/Toast.jsx';

export const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    expirationDate: '',
    usageLimit: '',
    isActive: true
  });

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAdminCoupons();
      setCoupons(data);
    } catch (err) {
      setError(err.userMessage || 'Failed to load platform coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      expirationDate: '',
      usageLimit: '',
      isActive: true
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : '',
      expirationDate: coupon.expirationDate ? new Date(coupon.expirationDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit != null ? coupon.usageLimit : '',
      isActive: coupon.isActive
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (coupon) => {
    try {
      await adminService.updateAdminCoupon(coupon.id, { isActive: !coupon.isActive });
      addToast(`Coupon "${coupon.code}" ${!coupon.isActive ? 'activated' : 'deactivated'}`, 'success');
      loadCoupons();
    } catch (err) {
      addToast(err.userMessage || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    try {
      const res = await adminService.deleteAdminCoupon(coupon.id);
      addToast(res.message || 'Coupon deleted/deactivated', 'success');
      loadCoupons();
    } catch (err) {
      addToast(err.userMessage || 'Failed to delete coupon', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: formData.minOrderAmount !== '' ? Number(formData.minOrderAmount) : null,
      expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
      usageLimit: formData.usageLimit !== '' ? parseInt(formData.usageLimit, 10) : null,
      isActive: formData.isActive
    };

    try {
      if (editingCoupon) {
        await adminService.updateAdminCoupon(editingCoupon.id, payload);
        addToast(`Coupon "${payload.code}" updated successfully`, 'success');
      } else {
        await adminService.createAdminCoupon(payload);
        addToast(`Coupon "${payload.code}" created successfully`, 'success');
      }
      setModalOpen(false);
      loadCoupons();
    } catch (err) {
      setFormError(err.userMessage || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <AdminNavHeader />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 font-mono">
            Platform Coupons & Discounts
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configure global percentage and fixed-amount promotional vouchers for customers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-900 hover:bg-black text-white text-xs font-mono font-medium rounded-lg transition-colors shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Coupon
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadCoupons} className="underline font-mono">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 py-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-neutral-100 rounded-xl"></div>
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 border border-dashed border-neutral-300 rounded-2xl text-center space-y-3 bg-neutral-50/50">
          <p className="text-sm font-medium text-neutral-700">No promotional coupons configured yet.</p>
          <p className="text-xs text-neutral-400">Create your first coupon to offer discounts during checkout.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Discount Type</th>
                  <th className="px-5 py-3.5">Value</th>
                  <th className="px-5 py-3.5">Min Subtotal</th>
                  <th className="px-5 py-3.5">Expiry</th>
                  <th className="px-5 py-3.5">Usages</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {coupons.map((c) => {
                  const isExpired = c.expirationDate && new Date(c.expirationDate) < new Date();

                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                        <span className="px-2 py-0.5 bg-neutral-100 rounded border border-neutral-200">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.discountType === 'PERCENTAGE'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {c.discountType}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold">
                        {c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue)}%` : `₹${Number(c.discountValue).toFixed(2)}`}
                      </td>
                      <td className="px-5 py-4 font-mono text-neutral-600">
                        {c.minOrderAmount != null ? `₹${Number(c.minOrderAmount).toFixed(2)}` : 'None'}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        {c.expirationDate ? (
                          <span className={isExpired ? 'text-rose-600 font-semibold' : 'text-neutral-600'}>
                            {new Date(c.expirationDate).toLocaleDateString()}
                            {isExpired && ' (Expired)'}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-neutral-600">
                        {c.usedCount} / {c.usageLimit != null ? c.usageLimit : '∞'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2 font-mono">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="text-neutral-600 hover:text-neutral-900 underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="text-rose-600 hover:text-rose-800 underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 font-mono">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Platform Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-600 font-mono uppercase text-[10px] mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 font-mono uppercase border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-mono uppercase text-[10px] mb-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full p-2.5 font-mono border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden bg-white"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 font-mono uppercase text-[10px] mb-1">
                    Value * {formData.discountType === 'PERCENTAGE' ? '(Max 100)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full p-2.5 font-mono border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-mono uppercase text-[10px] mb-1">Min Subtotal (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full p-2.5 font-mono border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 font-mono uppercase text-[10px] mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited if empty"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full p-2.5 font-mono border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-mono uppercase text-[10px] mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full p-2.5 font-mono border border-neutral-300 rounded-lg focus:border-brand-900 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCoupon"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-brand-900 focus:ring-0"
                />
                <label htmlFor="isActiveCoupon" className="text-neutral-700 font-medium">
                  Active (enabled for customer redemption)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-brand-900 hover:bg-black text-white font-mono font-medium rounded-lg disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
