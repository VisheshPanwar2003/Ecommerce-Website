import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSellerProducts, updateProduct, deleteProduct, getSellerDashboard } from '../../services/sellerService.js';
import { useToast } from '../../components/common/Toast.jsx';
import SellerNavHeader from './SellerNavHeader.jsx';

export const SellerProductsPage = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE

  // Mutation in-progress states
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, dashboard] = await Promise.all([
        getSellerProducts(),
        getSellerDashboard().catch(() => null)
      ]);
      setProducts(productsData);
      setDashboardData(dashboard);
    } catch (err) {
      console.error('Failed to fetch seller products:', err);
      setError(err.response?.data?.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setUpdatingId(product.id);
      const updated = await updateProduct(product.id, { status: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: updated.status } : p))
      );
      addToast(
        `Product "${product.name}" marked as ${newStatus}.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update product status:', err);
      addToast(
        err.response?.data?.message || 'Failed to update product status.',
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setDeletingId(productToDelete.id);
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      addToast(`Product "${productToDelete.name}" deleted successfully.`, 'success');
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
      addToast(
        err.response?.data?.message || 'Failed to delete product. It may have existing orders.',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

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

      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Product Catalogue
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your store's products, pricing, variants, and active statuses.
          </p>
        </div>

        <Link
          to="/seller/products/new"
          id="add-product-btn"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            id="product-search-input"
            placeholder="Search by product name, SKU, or category..."
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Status:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
              <button
                key={st}
                type="button"
                id={`filter-status-${st.toLowerCase()}`}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {st === 'ALL' ? 'All Products' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Loading your store's products...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-rose-800 mb-3">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-neutral-900 mb-1">No products yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-5">
            Create your first product to start selling on the marketplace.
          </p>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Product
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-xs text-neutral-500 mb-2">
            No products match the selected filters or search query.
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
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock / Variants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredProducts.map((p) => {
                  const variantCount = p.variants ? p.variants.length : 0;
                  const totalStock =
                    variantCount > 0
                      ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                      : p.stock;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-neutral-400 line-clamp-1 max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600">
                        {p.sku || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        {p.category?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-900 font-medium">
                        ${Number(p.price).toFixed(2)}
                        {p.discount > 0 && (
                          <span className="ml-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                            -${Number(p.discount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-medium ${
                              totalStock <= 0
                                ? 'text-rose-600'
                                : totalStock <= 5
                                ? 'text-amber-600'
                                : 'text-neutral-800'
                            }`}
                          >
                            {totalStock} units
                          </span>
                        </div>
                        {variantCount > 0 && (
                          <span className="text-[10px] font-mono text-neutral-400">
                            ({variantCount} {variantCount === 1 ? 'variant' : 'variants'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-neutral-500 font-mono">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            disabled={updatingId === p.id}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                              p.status === 'ACTIVE'
                                ? 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                                : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                            }`}
                            title={p.status === 'ACTIVE' ? 'Deactivate product' : 'Activate product'}
                          >
                            {updatingId === p.id ? '...' : p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>

                          <Link
                            to={`/seller/products/${p.id}/edit`}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-rose-200 hover:bg-rose-50 text-rose-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">Delete Product</h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Are you sure you want to delete <strong className="text-neutral-900">"{productToDelete.name}"</strong>?
              This action cannot be undone. Products with existing customer orders cannot be deleted and should instead be deactivated.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={Boolean(deletingId)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deletingId ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
