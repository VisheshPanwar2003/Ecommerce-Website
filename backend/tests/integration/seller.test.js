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

describe('Integration: Seller Portal & Order Fulfillment', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const validAddress = {
    fullName: 'Fulfillment Customer',
    phone: '9876543210',
    addressLine: '88 Market St',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    country: 'India'
  };

  it('provides seller dashboard metrics and isolated product listings', async () => {
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Seller Prod 1' });
    await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Seller Prod 2' });

    const dashRes = await request(app)
      .get('/api/v1/seller/dashboard')
      .set('Authorization', `Bearer ${seller.token}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.metrics.totalProducts).toBe(2);

    const prodsRes = await request(app)
      .get('/api/v1/seller/products')
      .set('Authorization', `Bearer ${seller.token}`);

    expect(prodsRes.status).toBe(200);
    expect(prodsRes.body.data.products).toHaveLength(2);
  });

  it('handles valid fulfillment transitions (PENDING -> CONFIRMED -> PROCESSING)', async () => {
    const seller = await createTestSeller();
    const customer = await createTestUser();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, stock: 10 });

    // Place order as customer
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ shippingAddress: validAddress });

    const orderId = orderRes.body.data.order.id;

    // Seller advances status to CONFIRMED
    const patch1 = await request(app)
      .patch(`/api/v1/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ status: 'CONFIRMED' });

    expect(patch1.status).toBe(200);
    expect(patch1.body.data.order.orderStatus).toBe('CONFIRMED');

    // Seller advances status to PROCESSING
    const patch2 = await request(app)
      .patch(`/api/v1/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ status: 'PROCESSING' });

    expect(patch2.status).toBe(200);
    expect(patch2.body.data.order.orderStatus).toBe('PROCESSING');
  });

  it('rejects invalid state transitions with 400', async () => {
    const seller = await createTestSeller();
    const customer = await createTestUser();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, stock: 10 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ shippingAddress: validAddress });

    const orderId = orderRes.body.data.order.id;

    // PENDING cannot jump directly to DELIVERED
    const res = await request(app)
      .patch(`/api/v1/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid status transition/i);
  });

  it('restores product inventory upon order cancellation', async () => {
    const seller = await createTestSeller();
    const customer = await createTestUser();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, stock: 10 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 3 });

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ shippingAddress: validAddress });

    const orderId = orderRes.body.data.order.id;

    // Stock should be 7 after purchase
    const intermediateProduct = await prisma.product.findUnique({ where: { id: prod.id } });
    expect(intermediateProduct.stock).toBe(7);

    // Cancel order
    const cancelRes = await request(app)
      .patch(`/api/v1/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ status: 'CANCELLED' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.order.orderStatus).toBe('CANCELLED');

    // Stock should be restored back to 10
    const restoredProduct = await prisma.product.findUnique({ where: { id: prod.id } });
    expect(restoredProduct.stock).toBe(10);
  });
});
