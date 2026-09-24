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

describe('Integration: Cart and Wishlist Systems', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Cart Operations', () => {
    it('should add item to cart and increment quantity on duplicate add', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        price: 500,
        stock: 10
      });

      // 1. Add item
      const res1 = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 2 });

      expect(res1.status).toBe(201);
      expect(res1.body.data.cart.items).toHaveLength(1);
      expect(res1.body.data.cart.items[0].quantity).toBe(2);
      expect(res1.body.data.cart.subtotal).toBe(1000);

      // 2. Duplicate add increments quantity
      const res2 = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 3 });

      expect(res2.status).toBe(201);
      expect(res2.body.data.cart.items).toHaveLength(1);
      expect(res2.body.data.cart.items[0].quantity).toBe(5);
      expect(res2.body.data.cart.subtotal).toBe(2500);
    });

    it('should reject adding more quantity than available stock (400)', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        stock: 3
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id, quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/insufficient stock/i);
    });

    it('should update item quantity, remove item, and clear cart', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod1 = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        stock: 10
      });
      const prod2 = await createTestProduct({
        sellerId: seller.seller.id,
        categoryId: cat.id,
        stock: 10
      });

      // Add 2 items
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod1.id, quantity: 1 });
      const itemId = addRes.body.data.cart.items[0].id;

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod2.id, quantity: 1 });

      // Update quantity of item 1
      const updateRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity: 4 });

      expect(updateRes.status).toBe(200);
      const updatedItem = updateRes.body.data.cart.items.find((i) => i.id === itemId);
      expect(updatedItem.quantity).toBe(4);

      // Remove item 1
      const removeRes = await request(app)
        .delete(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(removeRes.status).toBe(204);

      // Clear entire cart
      const clearRes = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${user.token}`);
      expect(clearRes.status).toBe(204);

      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${user.token}`);
      expect(cartRes.body.data.cart.items).toHaveLength(0);
    });

    it('User A cannot delete User B cart item (returns 404)', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

      // Add to user B cart
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ productId: prod.id, quantity: 1 });
      const itemBId = addRes.body.data.cart.items[0].id;

      // User A attempts to delete User B's cart item
      const res = await request(app)
        .delete(`/api/v1/cart/items/${itemBId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cart item not found/i);
    });
  });

  describe('Wishlist Operations', () => {
    it('should add item and handle duplicate add idempotently', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

      // First add
      const res1 = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id });

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);

      // Duplicate add
      const res2 = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id });

      expect(res2.status).toBe(200);
      expect(res2.body.message).toMatch(/already in wishlist/i);

      // Verify list has only 1 entry
      const listRes = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${user.token}`);

      expect(listRes.body.data.wishlist.items).toHaveLength(1);
    });

    it('should remove item and clear wishlist', async () => {
      const user = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

      const addRes = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ productId: prod.id });
      const itemId = addRes.body.data.item.id;

      // Remove single item
      const removeRes = await request(app)
        .delete(`/api/v1/wishlist/items/${itemId}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(removeRes.status).toBe(204);

      // Clear wishlist
      const clearRes = await request(app)
        .delete('/api/v1/wishlist')
        .set('Authorization', `Bearer ${user.token}`);
      expect(clearRes.status).toBe(204);
    });

    it('User A cannot delete User B wishlist item (returns 404)', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id });

      const addRes = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ productId: prod.id });
      const itemBId = addRes.body.data.item.id;

      const res = await request(app)
        .delete(`/api/v1/wishlist/items/${itemBId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/wishlist item not found/i);
    });
  });
});
