import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import { cleanDatabase } from '../helpers/db.helper.js';
import {
  createTestSeller,
  createTestCategory,
  createTestProduct,
  getUniqueId
} from '../helpers/auth.helper.js';

describe('Integration: Product Catalog & Management', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Public Catalog Listing & Filtering', () => {
    it('should list active products with pagination metadata', async () => {
      const seller = await createTestSeller();
      const cat = await createTestCategory({ name: 'Electronics', slug: 'electronics' });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Phone' });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Tablet' });

      const res = await request(app).get('/api/v1/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1
      });
    });

    it('should filter products by category slug', async () => {
      const seller = await createTestSeller();
      const cat1 = await createTestCategory({ name: 'Books', slug: 'books' });
      const cat2 = await createTestCategory({ name: 'Music', slug: 'music' });

      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat1.id, name: 'Novels' });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat2.id, name: 'Album' });

      const res = await request(app).get('/api/v1/products?category=books');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].name).toContain('Novels');
    });

    it('should filter products by price range', async () => {
      const seller = await createTestSeller();
      const cat = await createTestCategory();

      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, price: 500 });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, price: 1500 });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, price: 2500 });

      const res = await request(app).get('/api/v1/products?minPrice=1000&maxPrice=2000');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(Number(res.body.data.products[0].price)).toBe(1500);
    });

    it('should sort products by price ascending and descending', async () => {
      const seller = await createTestSeller();
      const cat = await createTestCategory();

      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, price: 100 });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, price: 300 });

      const resAsc = await request(app).get('/api/v1/products?sort=price_asc');
      expect(resAsc.status).toBe(200);
      expect(Number(resAsc.body.data.products[0].price)).toBe(100);

      const resDesc = await request(app).get('/api/v1/products?sort=price_desc');
      expect(resDesc.status).toBe(200);
      expect(Number(resDesc.body.data.products[0].price)).toBe(300);
    });

    it('should search products by text query', async () => {
      const seller = await createTestSeller();
      const cat = await createTestCategory();

      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Wireless Mechanical Keyboard' });
      await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Cotton T-Shirt' });

      const res = await request(app).get('/api/v1/products?search=keyboard');

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].name).toContain('Keyboard');
    });

    it('should reject invalid pagination parameters with 400', async () => {
      const res = await request(app).get('/api/v1/products?page=0');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      const resLimit = await request(app).get('/api/v1/products?limit=100');
      expect(resLimit.status).toBe(400);
      expect(resLimit.body.success).toBe(false);
    });

    it('should fetch single product detail by ID', async () => {
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const prod = await createTestProduct({ sellerId: seller.seller.id, categoryId: cat.id, name: 'Detail Product' });

      const res = await request(app).get(`/api/v1/products/${prod.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.id).toBe(prod.id);
      expect(res.body.data.product.name).toBe(prod.name);
    });
  });

  describe('Product Mutations & Business Rules', () => {
    it('should reject product creation if category is inactive (400)', async () => {
      const seller = await createTestSeller();
      const inactiveCat = await createTestCategory({ isActive: false });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${seller.token}`)
        .send({
          name: 'Invalid Product',
          categoryId: inactiveCat.id,
          price: 500,
          stock: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive category/i);
    });

    it('should reject duplicate SKU with 409 Conflict', async () => {
      const seller = await createTestSeller();
      const cat = await createTestCategory();
      const sku = `SKU-DUP-${getUniqueId()}`;

      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${seller.token}`)
        .send({
          name: 'First Product',
          categoryId: cat.id,
          sku,
          price: 500,
          stock: 10
        });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${seller.token}`)
        .send({
          name: 'Duplicate SKU Product',
          categoryId: cat.id,
          sku,
          price: 600,
          stock: 5
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });
});
