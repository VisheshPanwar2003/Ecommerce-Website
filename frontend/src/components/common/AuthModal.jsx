import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';

export const AuthModal = () => {
  const { authModalOpen, setAuthModalOpen, authModalMessage, login, register } = useAuth();
  const { addToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        addToast('Signed in successfully', 'success');
      } else {
        await register(name, email, password);
        addToast('Account created and signed in', 'success');
      }
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err.userMessage || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-md p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="inline-block px-2.5 py-0.5 mb-2 rounded bg-neutral-100 text-neutral-600 font-mono text-xs tracking-wider uppercase">
            Customer Access
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {isLogin ? 'Sign in to NOVA' : 'Create an Account'}
          </h2>
          {authModalMessage && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-2.5 py-1.5 mt-2">
              {authModalMessage}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded p-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-900 focus:border-brand-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-900 focus:border-brand-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-900 focus:border-brand-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="font-medium text-brand-900 hover:underline"
          >
            {isLogin ? 'Create one now' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
