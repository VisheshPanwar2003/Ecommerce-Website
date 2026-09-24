import React from 'react';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 flex flex-col animate-pulse">
      {/* Image box skeleton */}
      <div className="w-full aspect-square bg-neutral-100 rounded-lg mb-3"></div>

      {/* Category skeleton */}
      <div className="h-3 w-16 bg-neutral-100 rounded mb-2"></div>

      {/* Title skeleton */}
      <div className="h-4 w-3/4 bg-neutral-100 rounded mb-1.5"></div>
      <div className="h-4 w-1/2 bg-neutral-100 rounded mb-3"></div>

      {/* Price skeleton */}
      <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
        <div className="h-5 w-20 bg-neutral-100 rounded"></div>
        <div className="h-4 w-12 bg-neutral-100 rounded"></div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductSkeleton;
