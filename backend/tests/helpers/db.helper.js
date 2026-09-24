import prisma from '../../src/config/prisma.js';

/**
 * Safely clean all database tables in the dedicated test database.
 * Safeguarded to NEVER execute against development or production databases.
 */
export async function cleanDatabase() {
  const activeUrl = process.env.DATABASE_URL || '';
  if (!activeUrl.includes('test') && !activeUrl.includes('ecommerce_test')) {
    throw new Error(
      `[REFUSING TRUNCATE]: Database URL "${activeUrl}" is not a test database!`
    );
  }

  // Delete in reverse foreign key order
  await prisma.couponUsage.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.user.deleteMany({});
}

export default {
  cleanDatabase
};
