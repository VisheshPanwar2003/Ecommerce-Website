import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const SellerNavHeader = ({ storeName, storeStatus = 'ACTIVE' }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => {
    if (path === '/seller' && location.pathname === '/seller') return true;
    if (path !== '/seller' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="pb-6 border-b border-neutral-200 mb-8">
      {/* Top row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-neutral-500">
              Merchant Portal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {storeStatus}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {storeName || 'Merchant Console'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Managed by {user?.name || 'Authorized Merchant'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Product</span>
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
          >
            <span>Customer View</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-neutral-200 -mb-6 gap-2">
        <Link
          to="/seller"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            isCurrent('/seller') && location.pathname === '/seller'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Dashboard Overview
        </Link>
        <Link
          to="/seller/products"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            isCurrent('/seller/products')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Products
        </Link>
        <Link
          to="/seller/inventory"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            isCurrent('/seller/inventory')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Inventory Management
        </Link>
        <Link
          to="/seller/orders"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            isCurrent('/seller/orders')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Orders
        </Link>
      </div>
    </div>
  );
};

export default SellerNavHeader;
