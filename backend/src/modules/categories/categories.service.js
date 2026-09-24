import categoriesRepository from './categories.repository.js';
import AppError from '../../utils/AppError.js';
import { slugify } from '../../utils/slug.js';

export class CategoriesService {
  async getAllCategories() {
    return categoriesRepository.findAll();
  }

  async getCategoryById(id) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }

  async createCategory({ name, slug, description, isActive }) {
    const trimmedName = name.trim();
    const finalSlug = slug ? slug.trim().toLowerCase() : slugify(trimmedName);

    if (!finalSlug) {
      throw new AppError('Unable to generate valid slug from category name', 400);
    }

    // Pre-check for duplicate name
    const existingName = await categoriesRepository.findByName(trimmedName);
    if (existingName) {
      throw new AppError('Category with this name already exists', 409);
    }

    // Pre-check for duplicate slug
    const existingSlug = await categoriesRepository.findBySlug(finalSlug);
    if (existingSlug) {
      throw new AppError('Category with this slug already exists', 409);
    }

    try {
      return await categoriesRepository.create({
        name: trimmedName,
        slug: finalSlug,
        description: description ? description.trim() : null,
        isActive: isActive !== undefined ? isActive : true
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('name')) {
          throw new AppError('Category with this name already exists', 409);
        }
        if (target?.includes('slug')) {
          throw new AppError('Category with this slug already exists', 409);
        }
        throw new AppError('Category with this name or slug already exists', 409);
      }
      throw error;
    }
  }

  async updateCategory(id, updateData) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const payload = {};

    if (updateData.name !== undefined) {
      const trimmedName = updateData.name.trim();
      payload.name = trimmedName;

      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const existingName = await categoriesRepository.findByName(trimmedName);
        if (existingName && existingName.id !== id) {
          throw new AppError('Category with this name already exists', 409);
        }
      }
    }

    if (updateData.slug !== undefined) {
      const trimmedSlug = updateData.slug.trim().toLowerCase();
      payload.slug = trimmedSlug;

      if (trimmedSlug !== category.slug) {
        const existingSlug = await categoriesRepository.findBySlug(trimmedSlug);
        if (existingSlug && existingSlug.id !== id) {
          throw new AppError('Category with this slug already exists', 409);
        }
      }
    }

    if (updateData.description !== undefined) {
      payload.description = updateData.description ? updateData.description.trim() : null;
    }

    if (updateData.isActive !== undefined) {
      payload.isActive = updateData.isActive;
    }

    try {
      return await categoriesRepository.update(id, payload);
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('name')) {
          throw new AppError('Category with this name already exists', 409);
        }
        if (target?.includes('slug')) {
          throw new AppError('Category with this slug already exists', 409);
        }
        throw new AppError('Category with this name or slug already exists', 409);
      }
      throw error;
    }
  }

  async deleteCategory(id) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if any products reference this category
    const productCount = await categoriesRepository.countProducts(id);
    if (productCount > 0) {
      throw new AppError('Cannot delete category with associated products', 400);
    }

    try {
      await categoriesRepository.delete(id);
    } catch (error) {
      if (error.code === 'P2003') {
        throw new AppError('Cannot delete category with associated products', 400);
      }
      throw error;
    }
  }
}

export default new CategoriesService();
