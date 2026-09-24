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

describe('Integration: Checkout & Order Flow', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const validShippingAddress = {
    fullName: 'Alice Customer',
    phone: '9876543210',
    addressLine: '42 Galaxy Way',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India'
  };

  describe('Checkout Summary Calculations', () => {
    it('should compute authoritative pricing and shipping (subtotal < 1000 => shipping 99)', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        price: 450,
        stock: 10
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 1 });

      const res = await request(app)
        .get('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.subtotal)).toBe(450);
      expect(Number(res.body.data.shipping)).toBe(99);
      expect(Number(res.body.data.total)).toBe(549);
    });

    it('should grant free shipping when subtotal >= 1000', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        price: 1200,
        stock: 5
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 1 });

      const res = await request(app)
        .get('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.status).toBe(200);
      expect(Number(res.body.data.subtotal)).toBe(1200);
      expect(Number(res.body.data.shipping)).toBe(0);
      expect(Number(res.body.data.total)).toBe(1200);
    });
  });

  describe('Order Creation & Invariants', () => {
    it('should create order from cart, clear cart, snapshot items, and ignore client total manipulation', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        price: 600,
        stock: 10
      });

      // Add item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 2 });

      // Place order while attempting client-side price tampering (subtotal: 10, total: 10)
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          shippingAddress: validShippingAddress,
          subtotal: 10,
          total: 10,
          discount: 500
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const orderData = res.body.data.order;
      expect(orderData).toBeDefined();
      // Server authoritative check: 600 * 2 = 1200 (free shipping)
      expect(Number(orderData.subtotal)).toBe(1200);
      expect(Number(orderData.shippingAmount)).toBe(0);
      expect(Number(orderData.total)).toBe(1200);
      expect(orderData.items).toHaveLength(1);
      expect(orderData.items[0].productName).toBe(prod.name);

      // Verify cart has been cleared
      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${user.token}`);
      expect(cartRes.body.data.cart.items).toHaveLength(0);

      // Verify stock deducted in DB
      const updatedProd = await prisma.product.findUnique({ where: { id: prod.id } });
      expect(updatedProd.stock).toBe(8);
    });

    it('customer can see own orders in order history', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        price: 500,
        stock: 5
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 1 });

      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ shippingAddress: validShippingAddress });

      const historyRes = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${user.token}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
      expect(historyRes.body.data.orders).toHaveLength(1);
    });
  });
});
