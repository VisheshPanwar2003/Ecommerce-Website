import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import productService from '../../services/productService.js';
import reviewService from '../../services/reviewService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCartWishlist } from '../../context/CartWishlistContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';

const StarRating = ({ rating, max = 5, onRate, interactive = false, size = 'w-4 h-4' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const activeRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-0.5' : 'cursor-default'}`}
          aria-label={`Rate ${star} stars`}
        >
          <svg
            className={`${size} ${
              activeRating >= star ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'
            } transition-colors`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, promptLogin } = useAuth();
  const { isProductWishlisted, toggleWishlist, addItemToCart } = useCartWishlist();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);
  const [eligibility, setEligibility] = useState({ canReview: false, hasPurchased: false, hasReviewed: false });
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const loadReviewsData = async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const data = await reviewService.getProductReviews(id);
      setReviews(data.reviews || []);
      if (data.ratingStats) {
        setRatingStats(data.ratingStats);
      }
    } catch (err) {
      setReviewsError(err.userMessage || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadEligibilityData = async () => {
    if (!isAuthenticated || user?.role !== 'CUSTOMER') {
      setEligibility({ canReview: false, hasPurchased: false, hasReviewed: false });
      return;
    }
    setEligibilityLoading(true);
    try {
      const data = await reviewService.checkReviewEligibility(id);
      setEligibility(data);
    } catch {
      setEligibility({ canReview: false, hasPurchased: false, hasReviewed: false });
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [id]);

  useEffect(() => {
    loadEligibilityData();
  }, [id, isAuthenticated, user?.role]);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      setReviewFormError('Please enter a comment');
      return;
    }
    setSubmittingReview(true);
    setReviewFormError(null);
    try {
      await reviewService.createReview(id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      });
      addToast('Review submitted successfully!', 'success');
      setReviewForm({ rating: 5, comment: '' });
      await Promise.all([loadReviewsData(), loadEligibilityData()]);
    } catch (err) {
      setReviewFormError(err.userMessage || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditing = (rev) => {
    setEditingReviewId(rev.id);
    setEditForm({ rating: rev.rating, comment: rev.comment });
    setEditError(null);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editForm.comment.trim()) {
      setEditError('Please enter a comment');
      return;
    }
    setSubmittingEdit(true);
    setEditError(null);
    try {
      await reviewService.updateReview(editingReviewId, {
        rating: editForm.rating,
        comment: editForm.comment.trim()
      });
      addToast('Review updated successfully!', 'success');
      setEditingReviewId(null);
      await Promise.all([loadReviewsData(), loadEligibilityData()]);
    } catch (err) {
      setEditError(err.userMessage || 'Failed to update review');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeletingReviewId(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      addToast('Review deleted successfully!', 'success');
      await Promise.all([loadReviewsData(), loadEligibilityData()]);
    } catch (err) {
      addToast(err.userMessage || 'Failed to delete review', 'error');
    } finally {
      setDeletingReviewId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const prod = await productService.getProductById(id);
        if (isMounted) {
          if (!prod) {
            setError('Product not found');
          } else {
            setProduct(prod);
            // Default select the first active variant if available
            const activeVariants = (prod.variants || []).filter((v) => v.isActive);
            if (activeVariants.length > 0) {
              setSelectedVariantId(activeVariants[0].id);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage || 'Failed to load product details');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-6xl mx-auto py-6">
        <div className="h-4 w-48 bg-neutral-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-neutral-200 rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-neutral-200 rounded"></div>
            <div className="h-8 w-3/4 bg-neutral-200 rounded"></div>
            <div className="h-6 w-32 bg-neutral-200 rounded"></div>
            <div className="h-24 w-full bg-neutral-200 rounded"></div>
            <div className="h-12 w-full bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-4 font-mono font-bold">
          !
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          {error || 'Product Not Found'}
        </h2>
        <p className="text-xs text-neutral-500 mb-6">
          The requested product could not be loaded or may no longer be available.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center px-4 py-2 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg font-mono transition-colors"
        >
          &larr; Back to Catalogue
        </Link>
      </div>
    );
  }

  // Active variants
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) || null;

  // Inventory and pricing derivation
  const basePrice = Number(product.price);
  const discount = Number(product.discount || 0);

  // Variant may override price if variant.price is specified
  const effectiveBasePrice =
    selectedVariant && selectedVariant.price != null
      ? Number(selectedVariant.price)
      : basePrice;

  const finalPrice = Math.max(0, effectiveBasePrice - discount);
  const hasDiscount = discount > 0;
  const discountPercentage = hasDiscount
    ? Math.round((discount / effectiveBasePrice) * 100)
    : 0;

  // Single source of truth for stock: variant stock if variant chosen, else product.stock
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = availableStock <= 0;
  const isWishlisted = isProductWishlisted(product.id);

  // Images
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImageUrl = images[selectedImageIndex]?.url || null;

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (availableStock > 0 && next > availableStock) return availableStock;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || addingToCart) return;

    setAddingToCart(true);
    try {
      const res = await addItemToCart(
        product.id,
        selectedVariant ? selectedVariant.id : null,
        quantity
      );
      if (res.success) {
        addToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`, 'success');
      }
    } catch (err) {
      addToast(err.userMessage || 'Failed to add item to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const res = await toggleWishlist(product.id);
      if (res.success) {
        addToast(
          res.wishlisted ? 'Added to wishlist' : 'Removed from wishlist',
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-neutral-400">
        <Link to="/shop" className="hover:text-neutral-900 transition-colors">
          CATALOGUE
        </Link>
        <span>/</span>
        {product.category ? (
          <Link
            to={`/shop?category=${product.category.slug}`}
            className="hover:text-neutral-900 transition-colors uppercase"
          >
            {product.category.name}
          </Link>
        ) : (
          <span>GENERAL</span>
        )}
        <span>/</span>
        <span className="text-neutral-800 truncate max-w-xs font-medium">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Left Column: Visual Gallery (5 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Main Showcase Image */}
          <div className="relative w-full aspect-square bg-[#f5f5f4] rounded-xl overflow-hidden border border-neutral-100 flex items-center justify-center">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={images[selectedImageIndex]?.altText || product.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-300 p-8">
                <svg
                  className="w-16 h-16 stroke-[1.25]"
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
                <span className="text-xs font-mono mt-2 text-neutral-400">NO PREVIEW AVAILABLE</span>
              </div>
            )}

            {/* Badges on main image */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {hasDiscount && (
                <span className="px-2.5 py-1 bg-brand-900 text-white font-mono text-xs font-semibold rounded shadow-sm">
                  SAVE {discountPercentage}%
                </span>
              )}
              {isOutOfStock && (
                <span className="px-2.5 py-1 bg-neutral-900 text-neutral-200 font-mono text-xs font-medium rounded shadow-sm">
                  OUT OF STOCK
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery (if multiple images exist) */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-brand-900 ring-2 ring-brand-900/10'
                      : 'border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.altText || `View ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specification Dossier (7 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header: Store Name, SKU & Title */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                  STORE / {product.seller?.storeName || 'DIRECT'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  SKU: {selectedVariant?.sku || product.sku}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating Summary Header */}
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={Math.round((ratingStats?.average ?? product.rating?.average) || 0)} size="w-4 h-4" />
                {((ratingStats?.count ?? product.rating?.count) || 0) > 0 ? (
                  <a href="#reviews" className="text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:underline">
                    <span className="font-semibold text-neutral-900">
                      {(ratingStats?.average ?? product.rating?.average)?.toFixed(1)}
                    </span>{' '}
                    ({ratingStats?.count ?? product.rating?.count}{' '}
                    {(ratingStats?.count ?? product.rating?.count) === 1 ? 'review' : 'reviews'})
                  </a>
                ) : (
                  <span className="text-xs font-mono text-neutral-400">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Price Block */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-neutral-900 font-mono">
                    ${finalPrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-neutral-400 line-through font-mono">
                      ${effectiveBasePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="text-xs text-emerald-700 font-mono font-medium">
                    You save ${discount.toFixed(2)} ({discountPercentage}% off)
                  </span>
                )}
              </div>

              {/* Stock Status Indicator */}
              <div className="text-right">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    Out of Stock
                  </span>
                ) : availableStock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                    Only {availableStock} left
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    In Stock ({availableStock} units)
                  </span>
                )}
              </div>
            </div>

            {/* Variants Selector (if product has active variants) */}
            {activeVariants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-600">
                    Select Variant:
                  </label>
                  {selectedVariant && (
                    <span className="text-xs font-mono text-neutral-400">
                      Stock: {selectedVariant.stock}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((variant) => {
                    const isSelected = variant.id === selectedVariantId;
                    const variantOutOfStock = variant.stock <= 0;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(variant.id);
                          setQuantity(1); // Reset quantity on variant switch
                        }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                          isSelected
                            ? 'bg-brand-900 text-white border-brand-900 shadow-xs'
                            : variantOutOfStock
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-60'
                            : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400'
                        }`}
                      >
                        <div className="font-semibold">{variant.name}</div>
                        <div
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-400'
                          }`}
                        >
                          {variant.sku}
                          {variant.price != null && (
                            <span className="ml-1.5">(${Number(variant.price).toFixed(2)})</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Overview & Description
              </h3>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description provided for this product catalogue item.'}
              </p>
            </div>
          </div>

          {/* Action Footer: Quantity + Add to Cart + Wishlist */}
          <div className="pt-8 border-t border-neutral-100 mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Quantity Counter */}
              <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 p-1">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-white hover:text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-mono font-semibold text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= availableStock || isOutOfStock}
                  className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-white hover:text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className="flex-1 py-3 px-6 bg-brand-900 hover:bg-black text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {addingToCart ? (
                  <span>Adding...</span>
                ) : isOutOfStock ? (
                  <span>Sold Out</span>
                ) : (
                  <>
                    <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span>Add to Cart &bull; ${(finalPrice * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`p-3 rounded-lg border transition-all ${
                  isWishlisted
                    ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                }`}
                title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isWishlisted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={1.75}
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="reviews" className="mt-16 pt-12 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={Math.round((ratingStats?.average ?? product.rating?.average) || 0)} size="w-5 h-5" />
              <span className="text-sm font-mono font-medium text-neutral-900">
                {(ratingStats?.average ?? product.rating?.average) !== null && (ratingStats?.average ?? product.rating?.average) !== undefined
                  ? `${(ratingStats?.average ?? product.rating?.average).toFixed(1)} out of 5`
                  : 'No ratings yet'}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                ({ratingStats?.count ?? product.rating?.count ?? 0}{' '}
                {(ratingStats?.count ?? product.rating?.count) === 1 ? 'customer review' : 'customer reviews'})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Review Form or Eligibility Notice (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200/80 shadow-xs">
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Write a Review
              </h3>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    You can review this product after purchasing it.
                  </p>
                  <button
                    type="button"
                    onClick={() => promptLogin('Please sign in to review this product')}
                    className="w-full py-2.5 px-4 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg font-mono transition-colors shadow-xs"
                  >
                    Sign In to Write a Review
                  </button>
                </div>
              ) : user?.role !== 'CUSTOMER' ? (
                <p className="text-xs text-neutral-500 italic">
                  Reviews can only be submitted by verified customer accounts.
                </p>
              ) : eligibilityLoading ? (
                <div className="py-4 text-xs font-mono text-neutral-500 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
                  Checking review eligibility...
                </div>
              ) : eligibility.hasReviewed ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    You have already reviewed this product. You can update or remove your review in the list.
                  </div>
                </div>
              ) : !eligibility.hasPurchased ? (
                <div className="p-4 bg-neutral-100/80 border border-neutral-200 rounded-lg text-center space-y-2">
                  <p className="text-xs font-medium text-neutral-700">
                    You can review this product after purchasing it.
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Only verified purchases are eligible for product ratings and feedback.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Rating:
                    </label>
                    <div className="flex items-center gap-3">
                      <StarRating
                        rating={reviewForm.rating}
                        interactive={true}
                        onRate={(star) => setReviewForm({ ...reviewForm, rating: star })}
                        size="w-6 h-6"
                      />
                      <span className="text-xs font-mono font-semibold text-neutral-700">
                        {reviewForm.rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Comment:
                    </label>
                    <textarea
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this product..."
                      maxLength={2000}
                      className="w-full text-xs p-3 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-brand-900 focus:border-brand-900 outline-hidden transition-all bg-white"
                      required
                    />
                    <div className="text-[10px] text-right text-neutral-400 font-mono mt-1">
                      {reviewForm.comment.length} / 2000
                    </div>
                  </div>

                  {reviewFormError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                      {reviewFormError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 px-4 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg font-mono transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Review List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {reviewsLoading ? (
              <div className="space-y-4 py-6">
                {[1, 2].map((n) => (
                  <div key={n} className="p-4 border border-neutral-200 rounded-xl space-y-3 animate-pulse">
                    <div className="h-4 w-28 bg-neutral-200 rounded"></div>
                    <div className="h-3 w-full bg-neutral-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-neutral-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : reviewsError ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
                <p className="text-xs text-rose-700">{reviewsError}</p>
                <button
                  type="button"
                  onClick={loadReviewsData}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg font-mono hover:bg-rose-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-10 border border-dashed border-neutral-200 rounded-xl text-center space-y-2 bg-neutral-50/50">
                <p className="text-sm font-medium text-neutral-700">No customer reviews yet</p>
                <p className="text-xs text-neutral-400">
                  Be the first verified customer to share feedback about this item.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const isOwner = user?.id && (user.id === rev.userId || user.id === rev.user?.id);
                  const isEditing = editingReviewId === rev.id;

                  return (
                    <div
                      key={rev.id}
                      className="p-5 bg-white border border-neutral-200 rounded-xl shadow-2xs space-y-3"
                    >
                      {isEditing ? (
                        <form onSubmit={handleUpdateReview} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-800">Edit Your Review</span>
                            <button
                              type="button"
                              onClick={() => setEditingReviewId(null)}
                              className="text-xs text-neutral-400 hover:text-neutral-600"
                            >
                              Cancel
                            </button>
                          </div>
                          <div>
                            <StarRating
                              rating={editForm.rating}
                              interactive={true}
                              onRate={(star) => setEditForm({ ...editForm, rating: star })}
                              size="w-5 h-5"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={editForm.comment}
                            onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                            maxLength={2000}
                            className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-brand-900 focus:border-brand-900 outline-hidden"
                            required
                          />
                          {editError && (
                            <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                              {editError}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={submittingEdit}
                              className="px-4 py-2 bg-brand-900 hover:bg-black text-white text-xs font-medium rounded-lg font-mono transition-colors disabled:opacity-50"
                            >
                              {submittingEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReviewId(null)}
                              className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg font-mono transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <StarRating rating={rev.rating} size="w-4 h-4" />
                              <span className="text-xs font-mono font-bold text-neutral-900">
                                {rev.rating} / 5
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-400">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line italic">
                            "{rev.comment}"
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">
                                {rev.user?.name || 'Customer'}
                              </span>
                              {rev.verifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Verified Purchase
                                </span>
                              )}
                            </div>

                            {isOwner && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditing(rev)}
                                  className="text-[11px] font-mono text-neutral-600 hover:text-neutral-900 underline"
                                >
                                  Edit
                                </button>
                                <span className="text-neutral-300">&bull;</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  disabled={deletingReviewId === rev.id}
                                  className="text-[11px] font-mono text-rose-600 hover:text-rose-800 underline disabled:opacity-40"
                                >
                                  {deletingReviewId === rev.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
