import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/slug.js';

describe('Unit: Slug Generation Utility', () => {
  it('should convert standard text to lowercase hyphenated slug', () => {
    expect(slugify('Electronics & Gadgets')).toBe('electronics-gadgets');
    expect(slugify('Smartphones and Accessories')).toBe('smartphones-and-accessories');
  });

  it('should remove apostrophes without adding hyphens', () => {
    expect(slugify("Men's Clothing")).toBe('mens-clothing');
    expect(slugify("Women’s Apparel")).toBe('womens-apparel');
  });

  it('should trim leading and trailing spaces and hyphens', () => {
    expect(slugify('  ---Vintage Leather Jacket---  ')).toBe('vintage-leather-jacket');
  });

  it('should collapse multiple consecutive non-alphanumeric characters into a single hyphen', () => {
    expect(slugify('Laptop #1 -- Special @ Edition!')).toBe('laptop-1-special-edition');
  });

  it('should handle empty or non-string inputs safely', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify(123)).toBe('');
  });
});
