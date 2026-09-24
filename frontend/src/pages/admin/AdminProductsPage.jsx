import React, { useState, useEffect, useMemo } from 'react';
import { getAdminProducts, updateProductStatus, getAdminCategories } from '../../services/adminService.js';
import { useToast } from '../../components/common/Toast.jsx';
import AdminNavHeader from './AdminNavHeader.jsx';

export const AdminProductsPage = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Mutation in-progress
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodsData, catsData] = await Promise.all([
        getAdminProducts(),
        getAdminCategories().catch(() => [])
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load products for moderation:', err);
      setError(err.response?.data?.message || 'Failed to load catalog products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'INACTIVE' ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} product "${product.name}"?`)) {
      return;
    }

    try {
      setUpdatingId(product.id);
      const updated = await updateProductStatus(product.id, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: updated.status } : p))
      );
      addToast(`Product "${product.name}" marked as ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update product status:', err);
      addToast(err.response?.data?.message || 'Failed to update product status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const target = `${p.name} ${p.sku} ${p.seller?.storeName || ''} ${p.category?.name || ''}`.toLowerCase();
      const matchesSearch = !searchTerm.trim() || target.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || p.category?.id === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminNavHeader />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Product Catalog Moderation
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Oversee all seller listings across categories, monitor pricing, and toggle catalog visibility.
          </p>
        </div>

        <button
          onClick={fetchProductsAndCategories}
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
          Refresh Products
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            id="product-search-input"
            placeholder="Search by product name, SKU, or merchant store..."
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-500">Status:</span>
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
              {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
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
      </div>

      {/* Content States */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Loading catalog products...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-rose-800 mb-3">{error}</p>
          <button
            onClick={fetchProductsAndCategories}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-xs text-neutral-500 mb-2">No products match the selected filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
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
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Merchant Store</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{p.name}</div>
                      {p.variantCount > 0 && (
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {p.variantCount} variant{p.variantCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                      {p.sku}
                    </td>

                    <td className="py-3 px-4 font-medium text-neutral-800">
                      {p.seller?.storeName || '—'}
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      {p.category?.name || 'Unassigned'}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      ${Number(p.price).toFixed(2)}
                      {p.discount > 0 && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded ml-1 border border-emerald-100">
                          -${Number(p.discount).toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={updatingId === p.id}
                        onClick={() => handleToggleStatus(p)}
                        className={`px-3 py-1 text-[11px] font-medium rounded border transition-colors ${
                          p.status === 'ACTIVE'
                            ? 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {updatingId === p.id ? 'Updating...' : p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

export default AdminProductsPage;
