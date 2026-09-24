import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const AdminNavHeader = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="pb-6 border-b border-neutral-200 mb-8">
      {/* Top row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-neutral-500">
              Platform Administration
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
              SUPERUSER
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Marketplace Command Center
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Admin console active for {user?.name || 'Administrator'} ({user?.email || 'admin@marketplace.internal'})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
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
          <Link
            to="/seller"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
          >
            <span>Merchant Portal</span>
          </Link>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-neutral-200 -mb-6 gap-2 overflow-x-auto pb-1 md:pb-0">
        <Link
          to="/admin"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin') && location.pathname === '/admin'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Dashboard Overview
        </Link>
        <Link
          to="/admin/users"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin/users')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Users
        </Link>
        <Link
          to="/admin/sellers"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin/sellers')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Sellers
        </Link>
        <Link
          to="/admin/products"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin/products')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Product Moderation
        </Link>
        <Link
          to="/admin/categories"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin/categories')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Categories
        </Link>
        <Link
          to="/admin/orders"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin/orders')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Marketplace Orders
        </Link>
        <Link
          to="/admin/coupons"
          className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            isCurrent('/admin/coupons')
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Coupons
        </Link>
      </div>
    </div>
  );
};

export default AdminNavHeader;
