import React, { useState, useEffect } from 'react';

export const SearchInput = ({ value, onChange, placeholder = "Search products by name or description..." }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');

  // Keep local input in sync if URL parameter changes externally
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Debounce search update to avoid API spam while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (value || '')) {
        onChange(searchTerm.trim());
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, value, onChange]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-900 focus:border-brand-900 transition-colors shadow-sm"
      />

      {searchTerm && (
        <button
          onClick={handleClear}
          type="button"
          aria-label="Clear search query"
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchInput;
