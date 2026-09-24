import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getSellerInventory,
  createInventoryMovement,
  getSellerDashboard
} from '../../services/sellerService.js';
import { useToast } from '../../components/common/Toast.jsx';
import SellerNavHeader from './SellerNavHeader.jsx';

export const SellerInventoryPage = () => {
  const { addToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('ALL'); // ALL | OUT_OF_STOCK | LOW_STOCK | IN_STOCK

  // Movement Action Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementType, setMovementType] = useState('RESTOCK'); // RESTOCK | ADJUSTMENT | RETURN
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, dashboard] = await Promise.all([
        getSellerInventory(),
        getSellerDashboard().catch(() => null)
      ]);
      setInventory(invData);
      setDashboardData(dashboard);
    } catch (err) {
      console.error('Failed to load seller inventory:', err);
      setError(err.response?.data?.message || 'Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openActionModal = (item, type) => {
    setSelectedItem(item);
    setMovementType(type);
    setQuantity('');
    setReason('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormError(null);
    setQuantity('');
    setReason('');
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty)) {
      setFormError('Quantity must be an integer.');
      return;
    }

    if ((movementType === 'RESTOCK' || movementType === 'RETURN') && parsedQty <= 0) {
      setFormError(`Quantity for ${movementType} must be greater than zero.`);
      return;
    }

    if (movementType === 'ADJUSTMENT' && parsedQty === 0) {
      setFormError('Quantity for ADJUSTMENT cannot be zero.');
      return;
    }

    if (movementType === 'ADJUSTMENT' && selectedItem.currentStock + parsedQty < 0) {
      setFormError(
        `Insufficient stock: Adjustment would result in negative stock (${selectedItem.currentStock + parsedQty}).`
      );
      return;
    }

    if (!reason.trim()) {
      setFormError('A reference reason is required for audit logs.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        productId: selectedItem.productId,
        variantId: selectedItem.variantId || undefined,
        type: movementType,
        quantity: parsedQty,
        reason: reason.trim()
      };

      const result = await createInventoryMovement(payload);
      const newStock = result.inventory?.currentStock ?? (selectedItem.currentStock + parsedQty);

      // Update local state without full reload
      setInventory((prev) =>
        prev.map((item) => {
          const isSameTarget =
            item.productId === selectedItem.productId &&
            (item.variantId || null) === (selectedItem.variantId || null);

          if (isSameTarget) {
            return {
              ...item,
              currentStock: newStock
            };
          }
          return item;
        })
      );

      addToast(
        `Successfully applied ${movementType} (${parsedQty > 0 ? `+${parsedQty}` : parsedQty}) to ${selectedItem.productName}. New Stock: ${newStock}`,
        'success'
      );
      closeModal();
    } catch (err) {
      console.error('Failed to create inventory movement:', err);
      setFormError(err.response?.data?.message || 'Failed to record inventory movement.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStockCondition = (stock) => {
    if (stock <= 0) {
      return {
        label: 'Out of Stock',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        key: 'OUT_OF_STOCK'
      };
    }
    if (stock <= 5) {
      return {
        label: 'Low Stock',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        key: 'LOW_STOCK'
      };
    }
    return {
      label: 'In Stock',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      key: 'IN_STOCK'
    };
  };

  // Filtered inventory items
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const searchTarget = `${item.productName} ${item.productSku || ''} ${item.variantName || ''} ${item.variantSku || ''}`.toLowerCase();
      const matchesSearch = !searchTerm.trim() || searchTarget.includes(searchTerm.toLowerCase());

      const condition = getStockCondition(item.currentStock).key;
      const matchesCondition = conditionFilter === 'ALL' || condition === conditionFilter;

      return matchesSearch && matchesCondition;
    });
  }, [inventory, searchTerm, conditionFilter]);

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

      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Inventory & Stock Operations
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit stock levels, apply restocks, adjustments, and handle customer return entries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
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
            Refresh
          </button>
        </div>
      </div>

      {/* Search & Condition Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            id="inventory-search-input"
            placeholder="Search by product, variant, or SKU..."
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
          <span className="text-xs font-medium text-neutral-500">Stock Condition:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
            {[
              { key: 'ALL', label: 'All Items' },
              { key: 'OUT_OF_STOCK', label: 'Out of Stock' },
              { key: 'LOW_STOCK', label: 'Low Stock (≤5)' },
              { key: 'IN_STOCK', label: 'In Stock' }
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                id={`filter-condition-${f.key.toLowerCase()}`}
                onClick={() => setConditionFilter(f.key)}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                  conditionFilter === f.key
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-neutral-500">Loading inventory positions...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-rose-800 mb-3">{error}</p>
          <button
            onClick={fetchInventory}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-neutral-900 mb-1">No inventory found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
            You don't have any products or variants registered yet.
          </p>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Create Product
          </Link>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-xs text-neutral-500 mb-2">
            No inventory items match the current search or condition filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setConditionFilter('ALL');
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
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Variant Info</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-right">Inventory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredInventory.map((item, idx) => {
                  const condition = getStockCondition(item.currentStock);
                  const itemKey = `${item.productId}-${item.variantId || 'base'}-${idx}`;

                  return (
                    <tr key={itemKey} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">
                          {item.productName}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">
                          ID: {item.productId.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {item.hasVariants ? (
                          <div>
                            <span className="font-medium text-neutral-800">
                              {item.variantName}
                            </span>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              Status: {item.variantStatus}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">
                            Base Product (No Variants)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                        {item.variantSku || item.productSku || '—'}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900 text-sm">
                        {item.currentStock}
                        <span className="text-[10px] font-normal text-neutral-400 ml-1">
                          units
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${condition.badgeClass}`}
                        >
                          {condition.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openActionModal(item, 'RESTOCK')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                            title="Add newly received units to inventory"
                          >
                            + Restock
                          </button>

                          <button
                            type="button"
                            onClick={() => openActionModal(item, 'ADJUSTMENT')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors"
                            title="Apply signed correction delta (e.g. shrinkage, recount)"
                          >
                            Adjust
                          </button>

                          <button
                            type="button"
                            onClick={() => openActionModal(item, 'RETURN')}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 transition-colors"
                            title="Return customer item to shelf"
                          >
                            Return
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

      {/* Movement Action Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-400">
                  Inventory Movement
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {movementType === 'RESTOCK'
                    ? 'Restock Inventory'
                    : movementType === 'RETURN'
                    ? 'Process Customer Return'
                    : 'Manual Stock Adjustment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Target Item summary card */}
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 mb-4 text-xs">
              <div className="font-semibold text-neutral-900">{selectedItem.productName}</div>
              {selectedItem.variantName && (
                <div className="text-neutral-500 mt-0.5">
                  Variant: <span className="font-medium text-neutral-700">{selectedItem.variantName}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200 text-[11px] font-mono">
                <span className="text-neutral-500">Current Stock:</span>
                <span className="font-bold text-neutral-900">{selectedItem.currentStock} units</span>
              </div>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-lg text-xs">
                  {['RESTOCK', 'ADJUSTMENT', 'RETURN'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setMovementType(type);
                        setFormError(null);
                      }}
                      className={`py-1.5 rounded-md font-medium text-[11px] transition-colors ${
                        movementType === type
                          ? 'bg-white text-neutral-900 shadow-xs font-bold'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {movementType === 'ADJUSTMENT'
                    ? 'Adjustment Quantity (Positive or Negative Integer)'
                    : 'Quantity (Positive Integer)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder={
                    movementType === 'ADJUSTMENT'
                      ? 'e.g. 5 or -3'
                      : 'e.g. 20'
                  }
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  {movementType === 'RESTOCK'
                    ? 'Adds units to current stock.'
                    : movementType === 'RETURN'
                    ? 'Adds returned units to current stock.'
                    : 'Enter positive integer to increase, negative integer to decrease. Result cannot be negative.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Reason / Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    movementType === 'RESTOCK'
                      ? 'e.g. PO-8921 supplier delivery'
                      : movementType === 'RETURN'
                      ? 'e.g. RMA-4421 customer return verified'
                      : 'e.g. Physical inventory count discrepancy'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm"
                >
                  {submitting ? 'Applying Movement...' : 'Apply Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerInventoryPage;
