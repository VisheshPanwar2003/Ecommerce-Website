import prisma from '../../config/prisma.js';

export class CategoriesRepository {
  async findAll(filter = {}) {
    return prisma.category.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id) {
    return prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async findByName(name) {
    return prisma.category.findUnique({
      where: { name }
    });
  }

  async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug }
    });
  }

  async create(data) {
    return prisma.category.create({
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async update(id, data) {
    return prisma.category.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async delete(id) {
    return prisma.category.delete({
      where: { id }
    });
  }

  async countProducts(id) {
    return prisma.product.count({
      where: { categoryId: id }
    });
  }
}

export default new CategoriesRepository();
