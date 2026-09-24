import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCartWishlist } from '../../context/CartWishlistContext.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, logout, promptLogin } = useAuth();
  const { cartCount, wishlistCount } = useCartWishlist();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-6">
          <Link to="/shop" className="flex items-center gap-2 group">
            <span className="w-3 h-3 bg-brand-900 rounded-sm inline-block group-hover:scale-110 transition-transform"></span>
            <span className="font-bold tracking-tight text-lg text-neutral-900 font-mono">
              NOVA <span className="text-neutral-400 font-normal text-xs ml-1">/ STORE</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              to="/shop"
              className="px-3 py-1.5 rounded-md text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors font-medium"
            >
              Catalogue
            </Link>
          </nav>
        </div>

        {/* Right utility items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Wishlist indicator */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                promptLogin('Sign in to view your wishlist');
              } else {
                // Future Task 15/17 page or quick feedback
                navigate('/shop');
              }
            }}
            className="relative p-2 text-neutral-600 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={wishlistCount > 0 ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-600' : ''}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-mono font-semibold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart indicator */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                promptLogin('Sign in to view your cart');
              } else {
                // Future cart page
                navigate('/shop');
              }
            }}
            className="relative p-2 text-neutral-600 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Cart"
            aria-label="Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-900 text-white text-[10px] font-mono font-semibold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <div className="h-5 w-px bg-neutral-200" />

          {/* User Auth Info */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium text-neutral-900 leading-tight">
                  {user?.name || 'Customer'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {user?.role || 'CUSTOMER'}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-xs px-2.5 py-1.5 border border-neutral-200 hover:border-neutral-400 rounded-md text-neutral-700 hover:text-neutral-950 font-medium transition-colors"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => promptLogin('Sign in to access your cart and saved items')}
              className="text-xs px-3.5 py-1.5 bg-brand-900 hover:bg-black text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
