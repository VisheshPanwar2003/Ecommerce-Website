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

describe('Integration: Inventory Concurrency & Transactional Atomicity', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const validAddress = {
    fullName: 'Racer',
    phone: '9876543210',
    addressLine: '1 Race Track',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India'
  };

  it('prevents overselling under concurrent purchase requests (initial stock = 1)', async () => {
    // 1. Setup single item with stock = 1
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const product = await createTestProduct({
      sellerId: seller.seller.id,
      categoryId: cat.id,
      price: 500,
      stock: 1
    });

    // 2. Setup two separate customers
    const userA = await createTestUser();
    const userB = await createTestUser();

    // 3. Both customers put the 1 available item into their cart
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ productId: product.id, quantity: 1 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ productId: product.id, quantity: 1 });

    // 4. Fire concurrent checkout requests simultaneously
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ shippingAddress: validAddress }),
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ shippingAddress: validAddress })
    ]);

    const statuses = [resA.status, resB.status];

    // Assert exactly one 201 (success) and exactly one failure (400 or 409 conflict/insufficient stock)
    expect(statuses).toContain(201);
    const failureStatus = resA.status === 201 ? resB.status : resA.status;
    expect([400, 409]).toContain(failureStatus);

    const successRes = resA.status === 201 ? resA : resB;
    const failureRes = resA.status === 201 ? resB : resA;

    expect(successRes.body.success).toBe(true);
    expect(failureRes.body.success).toBe(false);
    expect(failureRes.body.message).toMatch(/(insufficient stock|out of stock)/i);

    // 5. Verify final inventory in database
    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });

    expect(finalProduct.stock).toBe(0); // Never negative!

    // 6. Verify total orders created for this product
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: product.id }
    });
    expect(orderItems).toHaveLength(1);
  });

  it('guarantees transactional atomicity: rolls back stock deduction if an error occurs during order creation', async () => {
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const product = await createTestProduct({
      sellerId: seller.seller.id,
      categoryId: cat.id,
      price: 500,
      stock: 5
    });

    const user = await createTestUser();

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ productId: product.id, quantity: 2 });

    // Execute order with simulated failure hook
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        shippingAddress: validAddress,
        _simulateFailureAfterDeduction: true
      });

    expect(res.status).toBe(500);

    // Verify stock is untouched (rolled back to 5)
    const productAfterRollback = await prisma.product.findUnique({
      where: { id: product.id }
    });
    expect(productAfterRollback.stock).toBe(5);

    // Verify no order was persisted
    const orders = await prisma.order.findMany({
      where: { userId: user.user.id }
    });
    expect(orders).toHaveLength(0);

    // Verify cart items were not cleared
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${user.token}`);
    expect(cartRes.body.data.cart.items).toHaveLength(1);
  });
});
