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
   * Allowed state transition map for order fulfillment
   */
  static ALLOWED_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: []
  };

  /**
   * Get seller's orders list (scoped to orders containing items belonging to this seller)
   */
  async getOrders(user, queryParams = {}) {
    const seller = await this.resolveSeller(user, queryParams.sellerId);
    const orders = await sellerRepository.findSellerOrders(seller.id);

    return orders.map((order) => {
      const sellerItems = (order.items || []).filter((item) => item.sellerId === seller.id);
      const otherItems = (order.items || []).filter((item) => item.sellerId !== seller.id);
      const isMultiVendor = otherItems.length > 0;

      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const totalQuantity = sellerItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

      return {
        id: order.id,
        orderId: order.id,
        orderStatus: order.orderStatus,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        isMultiVendor,
        canFulfill: !isMultiVendor,
        totalQuantity,
        sellerSubtotal: Number(sellerSubtotal.toFixed(2)),
        location: order.shippingCity ? `${order.shippingCity}, ${order.shippingState}` : null,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        customerName: order.shippingFullName,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: sellerItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          variantName: item.variantName || null,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount || 0),
          total: Number(item.total)
        }))
      };
    });
  }

  /**
   * Get single order detail belonging to the seller
   */
  async getOrderById(user, orderId) {
    const seller = await this.resolveSeller(user);
    const order = await sellerRepository.findOrderWithAllItems(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check that this order contains items belonging to this seller
    const sellerItems = (order.items || []).filter((item) => item.sellerId === seller.id);
    if (sellerItems.length === 0) {
      throw new AppError('Forbidden: You do not have permission to access this order', 403);
    }

    const otherItems = (order.items || []).filter((item) => item.sellerId !== seller.id);
    const isMultiVendor = otherItems.length > 0;
    const sellerSubtotal = sellerItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const totalQuantity = sellerItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const allowedTransitions = isMultiVendor
      ? []
      : SellerService.ALLOWED_TRANSITIONS[order.orderStatus] || [];

    return {
      id: order.id,
      orderId: order.id,
      orderStatus: order.orderStatus,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      isMultiVendor,
      canFulfill: !isMultiVendor,
      totalQuantity,
      sellerSubtotal: Number(sellerSubtotal.toFixed(2)),
      allowedTransitions,
      shippingAddress: {
        fullName: order.shippingFullName,
        phone: order.shippingPhone,
        addressLine: order.shippingAddressLine,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry
      },
      items: sellerItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        variantName: item.variantName || null,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount || 0),
        total: Number(item.total)
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  /**
   * Update order status with strict ownership and state transition validation
   */
  async updateOrderStatus(user, orderId, newStatus) {
    const seller = await this.resolveSeller(user);
    const order = await sellerRepository.findOrderWithAllItems(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Ownership check: seller must have items in this order
    const sellerItems = (order.items || []).filter((item) => item.sellerId === seller.id);
    if (sellerItems.length === 0) {
      throw new AppError('Forbidden: You do not have permission to manage this order', 403);
    }

    // Multi-vendor check: In a multi-vendor order, individual sellers cannot mutate shared order status
    const isMultiVendor = (order.items || []).some((item) => item.sellerId !== seller.id);
    if (isMultiVendor) {
      throw new AppError(
        'Cannot modify multi-vendor order status: This order contains items from multiple merchants. Global status cannot be modified by an individual seller.',
        403
      );
    }

    if (order.orderStatus === newStatus) {
      return this.getOrderById(user, orderId);
    }

    // Validate state transition
    const allowed = SellerService.ALLOWED_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${order.orderStatus} to ${newStatus}`,
        400
      );
    }

    if (newStatus === 'CANCELLED') {
      await sellerRepository.cancelOrderWithInventoryRestoration(order);
    } else {
      await sellerRepository.updateOrderStatus(order.id, newStatus);
    }

    return this.getOrderById(user, orderId);
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
