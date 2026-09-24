import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import { cleanDatabase } from '../helpers/db.helper.js';
import {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} from '../helpers/auth.helper.js';

describe('Integration: Ownership & IDOR Protection', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('User Resource Ownership', () => {
    it('User A cannot modify User B address (returns 404 for anti-enumeration)', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();

      // Create address for User B
      const addressB = await prisma.address.create({
        data: {
          userId: userB.user.id,
          fullName: 'User B',
          phone: '9876543210',
          addressLine: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        }
      });

      // User A attempts to patch User B's address
      const res = await request(app)
        .patch(`/api/v1/users/me/addresses/${addressB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          city: 'Hacked City'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify DB address remains unchanged
      const dbAddress = await prisma.address.findUnique({ where: { id: addressB.id } });
      expect(dbAddress.city).toBe('Mumbai');
    });

    it('User A cannot read User B order (returns 404 for anti-enumeration)', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();

      // Create order for User B
      const orderB = await prisma.order.create({
        data: {
          userId: userB.user.id,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal: 500,
          discount: 0,
          shippingAmount: 99,
          totalAmount: 599,
          shippingFullName: 'User B',
          shippingPhone: '9876543210',
          shippingAddressLine: '123 Main St',
          shippingCity: 'Mumbai',
          shippingState: 'Maharashtra',
          shippingPostalCode: '400001',
          shippingCountry: 'India'
        }
      });

      // User A attempts to get User B's order
      const res = await request(app)
        .get(`/api/v1/orders/${orderB.id}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/order not found/i);
    });

    it('User A cannot modify User B review (returns 403 Forbidden)', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

      // Create review by User B
      const reviewB = await prisma.review.create({
        data: {
          userId: userB.user.id,
          productId: prod.id,
          rating: 4,
          comment: 'Great product by User B'
        }
      });

      // User A attempts to update User B's review
      const res = await request(app)
        .patch(`/api/v1/reviews/${reviewB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          rating: 1,
          comment: 'Defaced by User A'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only edit your own reviews/i);

      // Verify DB review unchanged
      const dbReview = await prisma.review.findUnique({ where: { id: reviewB.id } });
      expect(dbReview.rating).toBe(4);
    });
  });

  describe('Seller Resource Ownership & Isolation', () => {
    it('Seller A cannot modify Seller B product (returns 403 Forbidden)', async () => {
      const sellerA = await createTestSeller();
      const sellerB = await createTestSeller();
      const cat = await createTestCategory();
      const prodB = await createTestProduct({
        sellerId: sellerB.seller.id,
        categoryId: cat.id,
        price: 1500
      });

      // Seller A attempts to update Seller B's product
      const res = await request(app)
        .patch(`/api/v1/products/${prodB.id}`)
        .set('Authorization', `Bearer ${sellerA.token}`)
        .send({
          price: 10 // Attacking seller's price
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission to modify this product/i);

      // Verify DB unchanged
      const dbProduct = await prisma.product.findUnique({ where: { id: prodB.id } });
      expect(Number(dbProduct.price)).toBe(1500);
    });

    it('Seller A cannot access Seller B product details in seller portal (returns 403 Forbidden)', async () => {
      const sellerA = await createTestSeller();
      const sellerB = await createTestSeller();
      const cat = await createTestCategory();
      const prodB = await createTestProduct({
        sellerId: sellerB.seller.id,
        categoryId: cat.id
      });

      const res = await request(app)
        .get(`/api/v1/seller/products/${prodB.id}`)
        .set('Authorization', `Bearer ${sellerA.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission to access this product/i);
    });

    it('Seller A cannot access Seller B order data (returns 403 Forbidden)', async () => {
      const sellerA = await createTestSeller();
      const sellerB = await createTestSeller();
      const customer = await createTestUser();
      const cat = await createTestCategory();
      const prodB = await createTestProduct({
        sellerId: sellerB.seller.id,
        categoryId: cat.id
      });

      // Create order containing only Seller B's product
      const order = await prisma.order.create({
        data: {
          userId: customer.user.id,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal: 1000,
          discount: 0,
          shippingAmount: 0,
          totalAmount: 1000,
          shippingFullName: 'Customer',
          shippingPhone: '9876543210',
          shippingAddressLine: '123 Main St',
          shippingCity: 'Mumbai',
          shippingState: 'Maharashtra',
          shippingPostalCode: '400001',
          shippingCountry: 'India',
          items: {
            create: [
              {
                productId: prodB.id,
                sellerId: sellerB.seller.id,
                productName: prodB.name,
                sku: prodB.sku,
                quantity: 1,
                unitPrice: 1000,
                discount: 0,
                total: 1000
              }
            ]
          }
        }
      });

      // Seller A attempts to access this order
      const res = await request(app)
        .get(`/api/v1/seller/orders/${order.id}`)
        .set('Authorization', `Bearer ${sellerA.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission to access this order/i);
    });
  });
});
