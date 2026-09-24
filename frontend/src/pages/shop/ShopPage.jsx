import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../../services/productService.js';
import categoryService from '../../services/categoryService.js';
import ProductCard from '../../components/products/ProductCard.jsx';
import { ProductGridSkeleton } from '../../components/products/ProductSkeleton.jsx';
import SearchInput from '../../components/shop/SearchInput.jsx';
import CategoryBar from '../../components/shop/CategoryBar.jsx';
import SortSelector from '../../components/shop/SortSelector.jsx';
import FilterDrawer from '../../components/shop/FilterDrawer.jsx';
import Pagination from '../../components/shop/Pagination.jsx';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filters from URL query parameters (source of truth)
  const searchQuery = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Component state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // 1. Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const catList = await categoryService.getCategories();
        if (isMounted) setCategories(catList);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch products whenever URL parameters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = {
      search: searchQuery || undefined,
      category: categorySlug || undefined,
      minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
      sort: sortParam || 'newest',
      page: pageParam,
      limit: 12
    };

    try {
      const data = await productService.getProducts(queryParams);
      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.userMessage || 'Failed to load products from server');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categorySlug, minPriceParam, maxPriceParam, sortParam, pageParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helper to update URL search parameters cleanly
  const updateUrlParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        updated.delete(key);
      } else {
        updated.set(key, String(val));
      }
    });
    setSearchParams(updated);
  };

  // Filter change handlers (all reset page to 1)
  const handleSearchChange = (term) => {
    updateUrlParams({ search: term, page: 1 });
  };

  const handleCategorySelect = (slug) => {
    updateUrlParams({ category: slug, page: 1 });
  };

  const handlePriceApply = (min, max) => {
    updateUrlParams({
      minPrice: min !== undefined ? min : '',
      maxPrice: max !== undefined ? max : '',
      page: 1
    });
  };

  const handleSortChange = (newSort) => {
    updateUrlParams({ sort: newSort, page: 1 });
  };

  const handlePageChange = (newPage) => {
    updateUrlParams({ page: newPage });
  };

  const handleResetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeCategoryName = useMemo(() => {
    if (!categorySlug) return null;
    const cat = categories.find((c) => c.slug === categorySlug);
    return cat ? cat.name : categorySlug;
  }, [categorySlug, categories]);

  const hasActiveFilters = Boolean(
    searchQuery || categorySlug || minPriceParam || maxPriceParam
  );

  return (
    <div className="space-y-6">
      {/* Editorial Discovery Header */}
      <div className="border-b border-neutral-200/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                DISCOVER / CATALOGUE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Product Discovery Console
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Explore authentic multi-vendor products with real-time stock and dynamic pricing.
            </p>
          </div>

          {/* Search bar in header for wide screens */}
          <div className="w-full md:w-80 lg:w-96">
            <SearchInput value={searchQuery} onChange={handleSearchChange} />
          </div>
        </div>

        {/* Category Horizontal Navigation */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <CategoryBar
            categories={categories}
            selectedCategory={categorySlug}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      </div>

      {/* Control bar: count, mobile filter trigger, sort selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-neutral-200/70 rounded-xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium font-mono transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
              />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-900 ml-0.5"></span>
            )}
          </button>

          {/* Product Count */}
          <div className="text-xs font-mono text-neutral-600">
            {loading ? (
              <span className="inline-block w-20 h-4 bg-neutral-100 rounded animate-pulse" />
            ) : (
              <span>
                <strong className="text-neutral-900 font-semibold">
                  {pagination?.totalItems ?? products.length}
                </strong>{' '}
                {pagination?.totalItems === 1 ? 'PRODUCT' : 'PRODUCTS'}
              </span>
            )}
          </div>
        </div>

        {/* Sort Selector */}
        <div className="ml-auto">
          <SortSelector value={sortParam} onChange={handleSortChange} />
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-mono text-neutral-400">Active Filters:</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs text-neutral-700">
              Query: <strong>"{searchQuery}"</strong>
              <button
                onClick={() => handleSearchChange('')}
                className="text-neutral-400 hover:text-neutral-900"
                aria-label="Remove search filter"
              >
                ✕
              </button>
            </span>
          )}

          {categorySlug && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs text-neutral-700">
              Category: <strong>{activeCategoryName}</strong>
              <button
                onClick={() => handleCategorySelect('')}
                className="text-neutral-400 hover:text-neutral-900"
                aria-label="Remove category filter"
              >
                ✕
              </button>
            </span>
          )}

          {(minPriceParam || maxPriceParam) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs text-neutral-700">
              Price: <strong>${minPriceParam || '0'} – ${maxPriceParam || '∞'}</strong>
              <button
                onClick={() => handlePriceApply(undefined, undefined)}
                className="text-neutral-400 hover:text-neutral-900"
                aria-label="Remove price filter"
              >
                ✕
              </button>
            </span>
          )}

          <button
            onClick={handleResetAllFilters}
            className="text-xs text-neutral-500 hover:text-neutral-950 underline font-mono ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="flex items-start gap-8">
        {/* Desktop Filter Sidebar */}
        <FilterDrawer
          minPrice={minPriceParam}
          maxPrice={maxPriceParam}
          onApplyPrice={handlePriceApply}
          onResetFilters={handleResetAllFilters}
          hasActiveFilters={hasActiveFilters}
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
        />

        {/* Product Catalog Display Area */}
        <div className="flex-1 min-w-0">
          {/* 1. Loading State */}
          {loading && <ProductGridSkeleton count={8} />}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="bg-white border border-rose-200 rounded-xl p-8 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900">
                Something went wrong loading products
              </h3>
              <p className="text-xs text-neutral-500 mt-1 mb-5">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                Try again
              </button>
            </div>
          )}

          {/* 3. Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="bg-white border border-neutral-200/80 rounded-xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900">
                No products found
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto mb-6">
                We couldn't find any products matching your active filters. Try searching for something else or adjusting your criteria.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetAllFilters}
                  className="px-4 py-2 border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-medium rounded-lg transition-colors font-mono"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* 4. Products Grid */}
          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
