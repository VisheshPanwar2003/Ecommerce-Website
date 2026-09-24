import sellerRepository from './seller.repository.js';
import AppError from '../../utils/AppError.js';

export class SellerService {
  /**
   * Resolve seller identity strictly based on authenticated user (never trusts client-supplied sellerId)
   */
  async resolveSeller(user, querySellerId = null) {
    if (user.role === 'SELLER') {
      const seller = await sellerRepository.findSellerByUserId(user.id);
      if (!seller) {
        throw new AppError('Seller profile not found. Please register as a seller first.', 404);
      }
      if (seller.status === 'SUSPENDED') {
        throw new AppError('Seller account is suspended', 403);
      }
      return seller;
    }

    if (user.role === 'ADMIN') {
      let seller = null;
      if (querySellerId) {
        seller = await sellerRepository.findSellerById(querySellerId);
      } else {
        seller = await sellerRepository.findSellerByUserId(user.id);
        if (!seller) {
          seller = await sellerRepository.findFirstSeller();
        }
      }
      if (!seller) {
        throw new AppError('No seller profile found', 404);
      }
      return seller;
    }

    throw new AppError('Forbidden: Insufficient privileges', 403);
  }

  /**
   * Aggregate seller dashboard data (metrics, products, inventory, recent orders)
   */
  async getDashboardData(user, queryParams = {}) {
    const seller = await this.resolveSeller(user, queryParams.sellerId);

    // Parallel fetch of seller products and order items without cross-vendor leakage
    const [products, orderItems] = await Promise.all([
      sellerRepository.findSellerProducts(seller.id),
      sellerRepository.findSellerOrderItems(seller.id, 50)
    ]);

    // 1. Calculate Product & Inventory stats
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;

    let lowStockCount = 0;
    const inventoryItems = [];

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.stock <= 5) lowStockCount++;

          let stockStatus = 'In Stock';
          if (v.stock === 0) stockStatus = 'Out of Stock';
          else if (v.stock <= 5) stockStatus = 'Low Stock';

          inventoryItems.push({
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            productStatus: p.status,
            variantId: v.id,
            variantName: v.name,
            variantSku: v.sku,
            currentStock: v.stock,
            stockStatus,
            isVariant: true
          });
        }
      } else {
        if (p.stock <= 5) lowStockCount++;

        let stockStatus = 'In Stock';
        if (p.stock === 0) stockStatus = 'Out of Stock';
        else if (p.stock <= 5) stockStatus = 'Low Stock';

        inventoryItems.push({
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          productStatus: p.status,
          variantId: null,
          variantName: null,
          variantSku: null,
          currentStock: p.stock,
          stockStatus,
          isVariant: false
        });
      }
    }

    // 2. Calculate Order stats
    const uniqueOrderIds = new Set(orderItems.map((item) => item.orderId));
    const totalOrders = uniqueOrderIds.size;

    const pendingOrderIds = new Set(
      orderItems
        .filter((item) => item.order?.orderStatus === 'PENDING')
        .map((item) => item.orderId)
    );
    const pendingOrders = pendingOrderIds.size;

    const totalRevenue = orderItems.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    // 3. Formatted Products list
    const formattedProducts = products.map((p) => ({
      id: p.id,
      sellerId: p.sellerId,
      name: p.name,
      sku: p.sku,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null,
      price: Number(p.price),
      stock: p.stock,
      status: p.status,
      hasVariants: p.variants.length > 0,
      variantCount: p.variants.length,
      imageUrl: p.images?.[0]?.url || null,
      createdAt: p.createdAt
    }));

    // 4. Formatted Recent Orders (Multi-vendor safe: only seller's items)
    const recentOrders = orderItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName || null,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.total),
      orderStatus: item.order?.orderStatus || 'PENDING',
      paymentStatus: item.order?.paymentStatus || 'PENDING',
      location: item.order?.shippingCity
        ? `${item.order.shippingCity}, ${item.order.shippingState}`
        : null,
      createdAt: item.order?.createdAt || item.createdAt
    }));

    return {
      seller: {
        id: seller.id,
        storeName: seller.storeName,
        storeDescription: seller.storeDescription,
        status: seller.status,
        ownerName: seller.user?.name || null,
        ownerEmail: seller.user?.email || null
      },
      metrics: {
        totalProducts,
        activeProducts,
        lowStockProducts: lowStockCount,
        totalOrders,
        pendingOrders,
        totalRevenue: Number(totalRevenue.toFixed(2))
      },
      products: formattedProducts,
      inventory: inventoryItems,
      recentOrders
    };
  }

  /**
   * Get seller's products only
   */
  async getProducts(user, queryParams = {}) {
    const seller = await this.resolveSeller(user, queryParams.sellerId);
    const products = await sellerRepository.findSellerProducts(seller.id);

    return products.map((p) => ({
      id: p.id,
      sellerId: p.sellerId,
      name: p.name,
      sku: p.sku,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null,
      price: Number(p.price),
      stock: p.stock,
      status: p.status,
      hasVariants: p.variants.length > 0,
      variantCount: p.variants.length,
      imageUrl: p.images?.[0]?.url || null,
      createdAt: p.createdAt
    }));
  }

  /**
   * Get seller's orders only (strictly scoped to items belonging to this seller)
   */
  async getOrders(user, queryParams = {}) {
    const seller = await this.resolveSeller(user, queryParams.sellerId);
    const orderItems = await sellerRepository.findSellerOrderItems(seller.id, 100);

    return orderItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName || null,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.total),
      orderStatus: item.order?.orderStatus || 'PENDING',
      paymentStatus: item.order?.paymentStatus || 'PENDING',
      location: item.order?.shippingCity
        ? `${item.order.shippingCity}, ${item.order.shippingState}`
        : null,
      createdAt: item.order?.createdAt || item.createdAt
    }));
  }

  /**
   * Get single product belonging to the authenticated seller
   */
  async getProductById(user, productId) {
    const seller = await this.resolveSeller(user);
    const product = await sellerRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    if (user.role === 'SELLER' && product.sellerId !== seller.id) {
      throw new AppError('Forbidden: You do not have permission to access this product', 403);
    }
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: Number(product.price),
      discount: Number(product.discount),
      stock: product.stock,
      status: product.status,
      categoryId: product.categoryId,
      category: product.category,
      variants: product.variants.map((v) => ({
        ...v,
        price: v.price != null ? Number(v.price) : null
      })),
      images: product.images,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }
}

export default new SellerService();
