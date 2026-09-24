import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartWishlist } from '../../context/CartWishlistContext.jsx';
import { useToast } from '../common/Toast.jsx';

export const ProductCard = ({ product }) => {
  const { isProductWishlisted, toggleWishlist } = useCartWishlist();
  const { addToast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const price = Number(product.price);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, price - discount);
  const hasDiscount = discount > 0;
  const discountPercentage = hasDiscount ? Math.round((discount / price) * 100) : 0;
  const isWishlisted = isProductWishlisted(product.id);
  const isOutOfStock = product.stock <= 0;

  const imageUrl =
    !imageError && product.images?.[0]?.url
      ? product.images[0].url
      : null;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const res = await toggleWishlist(product.id);
      if (res.success) {
        addToast(
          res.wishlisted ? 'Saved to wishlist' : 'Removed from wishlist',
          res.wishlisted ? 'success' : 'info'
        );
      }
    } catch {
      addToast('Failed to update wishlist', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-xl border border-neutral-200/80 hover:border-neutral-400 p-3.5 flex flex-col transition-all duration-200 hover:shadow-md">
      {/* Product Image Box */}
      <Link
        to={`/product/${product.id}`}
        className="relative w-full aspect-square bg-[#f5f5f4] rounded-lg overflow-hidden flex items-center justify-center mb-3 group-hover:opacity-95 transition-opacity"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.images?.[0]?.altText || product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-300 p-4">
            <svg
              className="w-12 h-12 stroke-[1.25]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span className="text-[11px] font-mono mt-1 text-neutral-400">NO IMAGE</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
              : 'bg-white/90 text-neutral-500 hover:text-neutral-900 hover:bg-white border border-neutral-200/60'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isWishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.75}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </button>

        {/* Top-left Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-brand-900 text-white font-mono text-[10px] font-semibold tracking-wider rounded">
              -{discountPercentage}%
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 bg-neutral-900/80 backdrop-blur-sm text-neutral-200 font-mono text-[10px] font-medium tracking-wider rounded">
              SOLD OUT
            </span>
          )}
        </div>
      </Link>

      {/* Product Metadata */}
      <div className="flex flex-col flex-1">
        {/* Category & Seller */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider truncate">
            {product.category?.name || 'General'}
          </span>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[10px] text-amber-700 font-mono font-medium">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link
          to={`/product/${product.id}`}
          className="text-sm font-semibold text-neutral-900 hover:text-neutral-600 line-clamp-2 leading-snug mb-2"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Price & Action Row */}
        <div className="mt-auto pt-2.5 border-t border-neutral-100 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-neutral-900 font-mono">
              ${finalPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through font-mono">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          <Link
            to={`/product/${product.id}`}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-950 font-mono group-hover:underline"
          >
            VIEW &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
