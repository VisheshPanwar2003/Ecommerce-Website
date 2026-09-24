import React, { useState, useEffect } from 'react';

export const FilterDrawer = ({
  minPrice,
  maxPrice,
  onApplyPrice,
  onResetFilters,
  hasActiveFilters,
  isOpen,
  onClose
}) => {
  const [localMin, setLocalMin] = useState(minPrice || '');
  const [localMax, setLocalMax] = useState(maxPrice || '');

  useEffect(() => {
    setLocalMin(minPrice || '');
  }, [minPrice]);

  useEffect(() => {
    setLocalMax(maxPrice || '');
  }, [maxPrice]);

  const handleApply = (e) => {
    e.preventDefault();
    const min = localMin !== '' ? Math.max(0, parseFloat(localMin)) : undefined;
    const max = localMax !== '' ? Math.max(0, parseFloat(localMax)) : undefined;
    onApplyPrice(min, max);
    if (onClose) onClose();
  };

  const handleReset = () => {
    setLocalMin('');
    setLocalMax('');
    onResetFilters();
    if (onClose) onClose();
  };

  const content = (
    <div className="space-y-6">
      {/* Price Range Section */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Price Range ($)
        </h3>
        <form onSubmit={handleApply} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-neutral-400 font-mono mb-1">MIN</label>
              <input
                type="number"
                min="0"
                step="any"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-900"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-400 font-mono mb-1">MAX</label>
              <input
                type="number"
                min="0"
                step="any"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                placeholder="1000"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-1.5 px-3 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors shadow-sm"
            >
              Apply Filter
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="py-1.5 px-3 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Inline Sidebar */}
      <div className="hidden lg:block w-56 shrink-0 bg-white border border-neutral-200 rounded-xl p-4 self-start shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Filters
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-[11px] text-neutral-400 hover:text-neutral-900 font-mono"
            >
              Clear all
            </button>
          )}
        </div>
        {content}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in"
            onClick={onClose}
          />
          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-neutral-900">
                Filters
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterDrawer;
