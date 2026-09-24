import adminRepository from './admin.repository.js';
import categoriesService from '../categories/categories.service.js';
import AppError from '../../utils/AppError.js';

export class AdminService {
  /**
   * Get operational dashboard metrics
   */
  async getDashboard() {
    return adminRepository.getDashboardMetrics();
  }

  /**
   * List users
   */
  async getUsers(filters = {}) {
    return adminRepository.findUsers(filters);
  }

  /**
   * Update user status (ACTIVE / SUSPENDED)
   */
  async updateUserStatus(userId, status) {
    const user = await adminRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      throw new AppError("Status must be either 'ACTIVE' or 'SUSPENDED'", 400);
    }

    return adminRepository.updateUserStatus(userId, status);
  }

  /**
   * List sellers with statistics
   */
  async getSellers(filters = {}) {
    return adminRepository.findSellers(filters);
  }

  /**
   * Update seller status (ACTIVE / SUSPENDED)
   */
  async updateSellerStatus(sellerId, status) {
    const seller = await adminRepository.findSellerById(sellerId);
    if (!seller) {
      throw new AppError('Seller not found', 404);
    }

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      throw new AppError("Status must be either 'ACTIVE' or 'SUSPENDED'", 400);
    }

    return adminRepository.updateSellerStatus(sellerId, status);
  }

  /**
   * List products for moderation
   */
  async getProducts(filters = {}) {
    return adminRepository.findProducts(filters);
  }

  /**
   * Moderate product status (ACTIVE / INACTIVE)
   */
  async updateProductStatus(productId, status) {
    const product = await adminRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new AppError("Status must be either 'ACTIVE' or 'INACTIVE'", 400);
    }

    return adminRepository.updateProductStatus(productId, status);
  }

  /**
   * Category management (Reusing existing category business logic)
   */
  async getCategories() {
    return categoriesService.getAllCategories();
  }

  async getCategoryById(id) {
    return categoriesService.getCategoryById(id);
  }

  async createCategory(categoryData) {
    return categoriesService.createCategory(categoryData);
  }

  async updateCategory(id, updateData) {
    return categoriesService.updateCategory(id, updateData);
  }

  async deleteCategory(id) {
    return categoriesService.deleteCategory(id);
  }

  /**
   * List marketplace-wide orders
   */
  async getOrders(filters = {}) {
    return adminRepository.findOrders(filters);
  }

  /**
   * View complete marketplace order detail
   */
  async getOrderById(orderId) {
    const order = await adminRepository.findOrderById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }
}

export default new AdminService();
