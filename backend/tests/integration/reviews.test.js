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

describe('Integration: Reviews and Ratings', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const validAddress = {
    fullName: 'Reviewer Customer',
    phone: '9876543210',
    addressLine: '99 Feedback Ave',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600001',
    country: 'India'
  };

  it('rejects review creation by non-purchaser with 403 Forbidden', async () => {
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

    const res = await request(app)
      .post(`/api/v1/products/${prod.id}/reviews`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        rating: 5,
        comment: 'Great product without buying'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/review products you have purchased/i);
  });

  it('rejects invalid rating outside 1–5 range with 400', async () => {
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

    // Invalid rating 0
    const res0 = await request(app)
      .post(`/api/v1/products/${prod.id}/reviews`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ rating: 0, comment: 'Too low' });

    expect(res0.status).toBe(400);

    // Invalid rating 6
    const res6 = await request(app)
      .post(`/api/v1/products/${prod.id}/reviews`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ rating: 6, comment: 'Too high' });

    expect(res6.status).toBe(400);
  });

  it('allows verified purchaser to review and updates rating aggregation', async () => {
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, stock: 10 });

    // Purchase product
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ shippingAddress: validAddress });

    // Submit review
    const reviewRes = await request(app)
      .post(`/api/v1/products/${prod.id}/reviews`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        rating: 5,
        comment: 'Outstanding quality and fast delivery'
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.review.rating).toBe(5);

    // Duplicate review attempt -> 409
    const dupRes = await request(app)
      .post(`/api/v1/products/${prod.id}/reviews`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        rating: 4,
        comment: 'Trying to review twice'
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toMatch(/already reviewed/i);

    // Check public listing and aggregation
    const publicList = await request(app).get(`/api/v1/products/${prod.id}/reviews`);
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.reviews).toHaveLength(1);
    expect(publicList.body.data.ratingStats.count).toBe(1);
    expect(Number(publicList.body.data.ratingStats.average)).toBe(5);
  });

  it('owner can edit and delete review', async () => {
    const customer = await createTestUser();
    const seller = await createTestSeller();
    const cat = await createTestCategory();
    const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, stock: 10 });

    // Buy product
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ productId: prod.id, quantity: 1 });

    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ shippingAddress: validAddress });

    // Create review
    const createRes = await request(app)
      .post(`/api/v1/products/${prod.id}/reviews`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ rating: 4, comment: 'Good' });

    const reviewId = createRes.body.data.review.id;

    // Edit review
    const editRes = await request(app)
      .patch(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ rating: 5, comment: 'Even better now' });

    expect(editRes.status).toBe(200);
    expect(editRes.body.data.review.rating).toBe(5);

    // Delete review
    const delRes = await request(app)
      .delete(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customer.token}`);

    expect(delRes.status).toBe(200);

    const checkDb = await prisma.review.findUnique({ where: { id: reviewId } });
    expect(checkDb).toBeNull();
  });
});
