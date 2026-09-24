import React, { useState, useEffect, useMemo } from 'react';
import { getAdminSellers, updateSellerStatus } from '../../services/adminService.js';
import { useToast } from '../../components/common/Toast.jsx';
import AdminNavHeader from './AdminNavHeader.jsx';

export const AdminSellersPage = () => {
  const { addToast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Mutation in-progress
  const [updatingId, setUpdatingId] = useState(null);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSellers();
      setSellers(data);
    } catch (err) {
      console.error('Failed to load sellers:', err);
      setError(err.response?.data?.message || 'Failed to load merchant accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleToggleStatus = async (seller) => {
    const newStatus = seller.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = newStatus === 'SUSPENDED' ? 'suspend' : 'reactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} seller account "${seller.storeName}"?`)) {
      return;
    }

    try {
      setUpdatingId(seller.id);
      const updated = await updateSellerStatus(seller.id, newStatus);
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, status: updated.status } : s))
      );
      addToast(`Merchant "${seller.storeName}" status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update seller status:', err);
      addToast(err.response?.data?.message || 'Failed to update seller status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const target = `${s.storeName} ${s.user?.name || ''} ${s.user?.email || ''}`.toLowerCase();
      const matchesSearch = !searchTerm.trim() || target.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sellers, searchTerm, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminNavHeader />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Seller Account Moderation
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit approved marketplace merchants, product counts, store activity, and account status.
          </p>
        </div>

        <button
          onClick={fetchSellers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors self-start sm:self-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Sellers
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            id="seller-search-input"
            placeholder="Search by store name, owner name, or email..."
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Status:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {st === 'ALL' ? 'All Merchants' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Loading merchant accounts...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-rose-800 mb-3">{error}</p>
          <button
            onClick={fetchSellers}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-xs text-neutral-500 mb-2">No sellers found matching current filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="text-xs text-neutral-900 font-semibold underline hover:no-underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Merchant Owner</th>
                  <th className="py-3 px-4">Catalog Products</th>
                  <th className="py-3 px-4">Order Items</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredSellers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{s.storeName}</div>
                      {s.storeDescription && (
                        <div className="text-[11px] text-neutral-400 line-clamp-1 max-w-xs mt-0.5">
                          {s.storeDescription}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-neutral-800 font-medium">{s.user?.name || '—'}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{s.user?.email || '—'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-800">
                      {s.productCount} products
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-800">
                      {s.orderCount} orders
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={updatingId === s.id}
                        onClick={() => handleToggleStatus(s)}
                        className={`px-3 py-1 text-[11px] font-medium rounded border transition-colors ${
                          s.status === 'ACTIVE'
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {updatingId === s.id ? 'Updating...' : s.status === 'ACTIVE' ? 'Suspend Merchant' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellersPage;
