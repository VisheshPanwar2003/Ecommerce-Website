import prisma from '../../config/prisma.js';

export class AdminRepository {
  /**
   * Aggregate platform-wide metrics efficiently
   */
  async getDashboardMetrics() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalSellers,
      activeSellers,
      suspendedSellers,
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.seller.count(),
      prisma.seller.count({ where: { status: 'ACTIVE' } }),
      prisma.seller.count({ where: { status: 'SUSPENDED' } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'INACTIVE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { orderStatus: 'PROCESSING' } }),
      prisma.order.count({ where: { orderStatus: 'SHIPPED' } }),
      prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          items: {
            select: { id: true, quantity: true, total: true }
          }
        }
      })
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers
      },
      sellers: {
        total: totalSellers,
        active: activeSellers,
        suspended: suspendedSellers
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customerName: o.shippingFullName || o.user?.name || 'Customer',
        customerEmail: o.user?.email || null,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        totalAmount: Number(o.totalAmount),
        itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: o.createdAt
      }))
    };
  }

  /**
   * Find users with safe projection and optional filtering
   */
  async findUsers({ search, role, status } = {}) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find single user by ID
   */
  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            status: true
          }
        }
      }
    });
  }

  /**
   * Update user status and synchronize seller account if present
   */
  async updateUserStatus(id, status) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              status: true
            }
          }
        }
      });

      // Maintain consistency: if user has a seller profile, align seller status
      if (user.seller) {
        await tx.seller.update({
          where: { id: user.seller.id },
          data: { status }
        });
      }

      return user;
    });
  }

  /**
   * Find sellers with product and order counts
   */
  async findSellers({ search, status } = {}) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { storeName: { contains: search.trim(), mode: 'insensitive' } },
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    const sellers = await prisma.seller.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            products: true,
            orderItems: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sellers.map((s) => ({
      id: s.id,
      storeName: s.storeName,
      storeDescription: s.storeDescription,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      user: s.user,
      productCount: s._count?.products || 0,
      orderCount: s._count?.orderItems || 0
    }));
  }

  /**
   * Find single seller by ID
   */
  async findSellerById(id) {
    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            products: true,
            orderItems: true
          }
        }
      }
    });

    if (!seller) return null;

    return {
      id: seller.id,
      storeName: seller.storeName,
      storeDescription: seller.storeDescription,
      status: seller.status,
      createdAt: seller.createdAt,
      updatedAt: seller.updatedAt,
      user: seller.user,
      productCount: seller._count?.products || 0,
      orderCount: seller._count?.orderItems || 0
    };
  }

  /**
   * Update seller status
   */
  async updateSellerStatus(id, status) {
    const updated = await prisma.seller.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            products: true,
            orderItems: true
          }
        }
      }
    });

    return {
      id: updated.id,
      storeName: updated.storeName,
      storeDescription: updated.storeDescription,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      user: updated.user,
      productCount: updated._count?.products || 0,
      orderCount: updated._count?.orderItems || 0
    };
  }

  /**
   * Find all products for moderation
   */
  async findProducts({ search, status, categoryId, sellerId } = {}) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { sku: { contains: search.trim(), mode: 'insensitive' } },
        { seller: { storeName: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        seller: {
          select: { id: true, storeName: true, status: true }
        },
        variants: {
          select: { id: true, name: true, sku: true, stock: true, isActive: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sku: p.sku,
      price: Number(p.price),
      discount: Number(p.discount),
      stock: p.stock,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      category: p.category,
      seller: p.seller,
      hasVariants: p.variants.length > 0,
      variantCount: p.variants.length,
      variants: p.variants
    }));
  }

  /**
   * Find single product by ID
   */
  async findProductById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        seller: {
          select: { id: true, storeName: true, status: true }
        },
        variants: {
          select: { id: true, name: true, sku: true, stock: true, isActive: true }
        }
      }
    });
  }

  /**
   * Update product moderation status
   */
  async updateProductStatus(id, status) {
    const updated = await prisma.product.update({
      where: { id },
      data: { status },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        seller: {
          select: { id: true, storeName: true, status: true }
        },
        variants: {
          select: { id: true, name: true, sku: true, stock: true, isActive: true }
        }
      }
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      sku: updated.sku,
      price: Number(updated.price),
      discount: Number(updated.discount),
      stock: updated.stock,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      category: updated.category,
      seller: updated.seller,
      hasVariants: updated.variants.length > 0,
      variantCount: updated.variants.length,
      variants: updated.variants
    };
  }

  /**
   * Find marketplace-wide orders
   */
  async findOrders({ search, status } = {}) {
    const where = {};

    if (status) {
      where.orderStatus = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { id: { contains: search.trim(), mode: 'insensitive' } },
        { shippingFullName: { contains: search.trim(), mode: 'insensitive' } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            seller: {
              select: { id: true, storeName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders.map((o) => {
      const sellersMap = new Map();
      o.items.forEach((item) => {
        if (item.seller) {
          sellersMap.set(item.seller.id, item.seller.storeName);
        }
      });

      return {
        id: o.id,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        shippingAmount: Number(o.shippingAmount),
        totalAmount: Number(o.totalAmount),
        customerName: o.shippingFullName || o.user?.name || 'Customer',
        customerEmail: o.user?.email || null,
        location: o.shippingCity ? `${o.shippingCity}, ${o.shippingState}` : null,
        itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        sellers: Array.from(sellersMap.entries()).map(([id, storeName]) => ({ id, storeName })),
        isMultiVendor: sellersMap.size > 1,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      };
    });
  }

  /**
   * Find complete marketplace order detail
   */
  async findOrderById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        items: {
          include: {
            seller: {
              select: { id: true, storeName: true }
            },
            product: {
              select: { id: true, name: true, sku: true }
            },
            variant: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    });

    if (!order) return null;

    const sellersMap = new Map();
    order.items.forEach((item) => {
      if (item.seller) {
        sellersMap.set(item.seller.id, item.seller.storeName);
      }
    });

    return {
      id: order.id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingAmount: Number(order.shippingAmount),
      totalAmount: Number(order.totalAmount),
      user: order.user,
      shippingAddress: {
        fullName: order.shippingFullName,
        phone: order.shippingPhone,
        addressLine: order.shippingAddressLine,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry
      },
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        variantName: i.variantName || null,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        total: Number(i.total),
        seller: i.seller
      })),
      sellers: Array.from(sellersMap.entries()).map(([sellerId, storeName]) => ({ id: sellerId, storeName })),
      isMultiVendor: sellersMap.size > 1,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

export default new AdminRepository();
