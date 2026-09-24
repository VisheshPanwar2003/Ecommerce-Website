/**
 * Generates a URL-friendly slug from a string.
 * - Converts to lowercase and trims
 * - Removes apostrophes (e.g. Men's -> Mens)
 * - Replaces non-alphanumeric sequences with hyphens
 * - Removes leading and trailing hyphens
 */
export const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default slugify;
