import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles = ['SELLER', 'ADMIN'] }) => {
  const { isAuthenticated, user, promptLogin } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Seller Authentication Required</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Please sign in to your merchant account to access the store management dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => promptLogin('Sign in with your seller account')}
              className="px-4 py-2 bg-brand-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Sign In
            </button>
            <Link
              to="/shop"
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Your authenticated account (<span className="font-mono text-neutral-900">{user.role}</span>) does not have merchant permissions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/shop"
              className="px-4 py-2 bg-brand-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
