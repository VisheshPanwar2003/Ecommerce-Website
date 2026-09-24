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

describe('Integration: Admin Control & Management', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('admin can toggle user status between ACTIVE and SUSPENDED', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const targetUser = await createTestUser({ status: 'ACTIVE' });

    // Suspend user
    const resSuspend = await request(app)
      .patch(`/api/v1/admin/users/${targetUser.user.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'SUSPENDED' });

    expect(resSuspend.status).toBe(200);
    expect(resSuspend.body.data.user.status).toBe('SUSPENDED');

    // Reactivate user
    const resActive = await request(app)
      .patch(`/api/v1/admin/users/${targetUser.user.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'ACTIVE' });

    expect(resActive.status).toBe(200);
    expect(resActive.body.data.user.status).toBe('ACTIVE');
  });

  it('admin can toggle seller status and moderate product status', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({
      sellerId: seller.seller.id,
      categoryId: cat.id,
      status: 'ACTIVE'
    });

    // Suspend seller
    const sellerRes = await request(app)
      .patch(`/api/v1/admin/sellers/${seller.seller.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'SUSPENDED' });

    expect(sellerRes.status).toBe(200);
    expect(sellerRes.body.data.seller.status).toBe('SUSPENDED');

    // Moderate product to INACTIVE
    const prodRes = await request(app)
      .patch(`/api/v1/admin/products/${prod.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'INACTIVE' });

    expect(prodRes.status).toBe(200);
    expect(prodRes.body.data.product.status).toBe('INACTIVE');
  });

  it('admin can perform category lifecycle (create, update, delete)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const uid = getUniqueId();

    // Create category
    const createRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: `Gadgets ${uid}`,
        description: 'Electronic gadgets'
      });

    expect(createRes.status).toBe(201);
    const catId = createRes.body.data.category.id;

    // Update category
    const updateRes = await request(app)
      .patch(`/api/v1/admin/categories/${catId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        description: 'Updated gadgets description'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.category.description).toBe('Updated gadgets description');

    // Delete category
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/categories/${catId}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(deleteRes.status).toBe(200);

    const checkDb = await prisma.category.findUnique({ where: { id: catId } });
    expect(checkDb).toBeNull();
  });

  it('admin can view platform-wide orders', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

    // Customer creates an order
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        shippingAddress: {
          fullName: 'Order Viewer',
          phone: '9876543210',
          addressLine: '123 Order St',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India'
        }
      });

    // Admin lists orders
    const ordersRes = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(ordersRes.status).toBe(200);
    expect(ordersRes.body.data.orders.length).toBeGreaterThanOrEqual(1);
  });
});
