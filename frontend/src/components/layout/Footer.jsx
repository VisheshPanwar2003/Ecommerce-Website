import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-brand-900 rounded-sm"></span>
            <span className="font-mono text-xs font-semibold tracking-wider text-neutral-800 uppercase">
              NOVA / DISCOVERY CONSOLE
            </span>
          </div>

          <div className="text-xs text-neutral-500 font-mono text-center sm:text-right">
            Curated multi-vendor catalog &bull; Real-time inventory
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <span>&copy; {new Date().getFullYear()} NOVA Platform. All rights reserved.</span>
          <span className="font-mono">Task 16 Frontend Integration &bull; ecommerce-v2</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
