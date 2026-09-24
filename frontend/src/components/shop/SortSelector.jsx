import React from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' }
];

export const SortSelector = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-400 font-mono hidden sm:inline uppercase">
        Sort:
      </span>
      <select
        value={value || 'newest'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort products"
        className="text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-900 focus:border-brand-900 shadow-sm cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortSelector;
