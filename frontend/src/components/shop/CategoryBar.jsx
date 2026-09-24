import React from 'react';

export const CategoryBar = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max">
        {/* All Categories Option */}
        <button
          onClick={() => onSelectCategory('')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase transition-all font-mono ${
            !selectedCategory
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          All Items
        </button>

        {/* Dynamic Active Categories */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.slug)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                isSelected
                  ? 'bg-brand-900 text-white shadow-sm font-medium'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
