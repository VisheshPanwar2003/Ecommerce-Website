import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import AuthModal from '../common/AuthModal.jsx';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};

export default Layout;
