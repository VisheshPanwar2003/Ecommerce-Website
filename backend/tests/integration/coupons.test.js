import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import { cleanDatabase } from '../helpers/db.helper.js';
import {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct,
  getUniqueId
} from '../helpers/auth.helper.js';

describe('Integration: Coupons and Discounts', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const validAddress = {
    fullName: 'Coupon User',
    phone: '9876543210',
    addressLine: '12 Discount Rd',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380001',
    country: 'India'
  };

  it('admin creates coupon and customer validates it against active cart', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({
      sellerId: seller.seller.id,
      categoryId: cat.id,
      price: 1000,
      stock: 10
    });

    const code = `PROMO_${getUniqueId()}`;

    // Admin creates percentage coupon
    const createRes = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        code,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 500,
        isActive: true
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.coupon.code).toBe(code);

    // Customer puts product in cart (subtotal = 1000)
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    // Customer validates coupon
    const valRes = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ code });

    expect(valRes.status).toBe(200);
    expect(valRes.body.success).toBe(true);
    expect(valRes.body.data.discount).toBe('200.00'); // 20% of 1000
  });

  it('rejects coupon if cart subtotal is below minOrderAmount', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({
      sellerId: seller.seller.id,
      categoryId: cat.id,
      price: 300,
      stock: 10
    });

    const code = `HIGHMIN_${getUniqueId()}`;

    await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        code,
        discountType: 'FIXED',
        discountValue: 50,
        minOrderAmount: 1000,
        isActive: true
      });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    const valRes = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ code });

    expect(valRes.status).toBe(400);
    expect(valRes.body.success).toBe(false);
    expect(valRes.body.message).toMatch(/minimum order amount/i);
  });

  it('rejects expired and inactive coupons', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, price: 1000 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    const codeInactive = `INACTIVE_${getUniqueId()}`;
    await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        code: codeInactive,
        discountType: 'FIXED',
        discountValue: 50,
        isActive: false
      });

    const inactRes = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ code: codeInactive });

    expect(inactRes.status).toBe(400);
    expect(inactRes.body.message).toMatch(/inactive/i);

    const codeExpired = `EXPIRED_${getUniqueId()}`;
    await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        code: codeExpired,
        discountType: 'FIXED',
        discountValue: 50,
        isActive: true,
        expirationDate: new Date(Date.now() - 86400000).toISOString()
      });

    const expRes = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ code: codeExpired });

    expect(expRes.status).toBe(400);
    expect(expRes.body.message).toMatch(/expired/i);
  });

  it('records CouponUsage and applies discount in order transaction', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({
      sellerId: seller.seller.id,
      categoryId: cat.id,
      price: 1500,
      stock: 10
    });

    const code = `ORDERPROMO_${getUniqueId()}`;
    await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        code,
        discountType: 'FIXED',
        discountValue: 200,
        isActive: true
      });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        shippingAddress: validAddress,
        couponCode: code
      });

    expect(orderRes.status).toBe(201);
    const orderData = orderRes.body.data.order;
    expect(Number(orderData.subtotal)).toBe(1500);
    expect(Number(orderData.discount)).toBe(200);
    expect(Number(orderData.total)).toBe(1300);

    // Verify CouponUsage entry in DB
    const couponUsages = await prisma.couponUsage.findMany({
      where: { orderId: orderData.id }
    });
    expect(couponUsages).toHaveLength(1);
    expect(couponUsages[0].userId).toBe(customer.user.id);
  });
});
