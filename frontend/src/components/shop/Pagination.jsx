import React from 'react';

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasPreviousPage, hasNextPage } = pagination;

  const handlePageClick = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display cleanly
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className="flex items-center justify-center gap-1.5 pt-10 pb-4"
    >
      {/* Previous button */}
      <button
        onClick={() => handlePageClick(page - 1)}
        disabled={!hasPreviousPage}
        aria-label="Go to previous page"
        className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-mono font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
      >
        &larr; Prev
      </button>

      {/* Numbered Page Buttons */}
      {getPageNumbers().map((num) => (
        <button
          key={num}
          onClick={() => handlePageClick(num)}
          aria-label={`Go to page ${num}`}
          aria-current={num === page ? 'page' : undefined}
          className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-all ${
            num === page
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
          }`}
        >
          {num}
        </button>
      ))}

      {/* Next button */}
      <button
        onClick={() => handlePageClick(page + 1)}
        disabled={!hasNextPage}
        aria-label="Go to next page"
        className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-mono font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
      >
        Next &rarr;
      </button>
    </nav>
  );
};

export default Pagination;
