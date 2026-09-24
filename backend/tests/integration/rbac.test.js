import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { cleanDatabase } from '../helpers/db.helper.js';
import { createTestUser, createTestSeller } from '../helpers/auth.helper.js';

describe('Integration: Role-Based Access Control (RBAC)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Admin Route Protection (/api/v1/admin/*)', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject CUSTOMER access to admin routes with 403', async () => {
      const { token } = await createTestUser({ role: 'CUSTOMER' });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject SELLER access to admin routes with 403', async () => {
      const { token } = await createTestSeller();

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow ADMIN access to admin routes with 200', async () => {
      const { token } = await createTestUser({ role: 'ADMIN' });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('users');
    });
  });

  describe('Seller Route Protection (/api/v1/seller/*)', () => {
    it('should reject unauthenticated requests to seller routes with 401', async () => {
      const res = await request(app).get('/api/v1/seller/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject CUSTOMER access to seller management routes with 403', async () => {
      const { token } = await createTestUser({ role: 'CUSTOMER' });

      const res = await request(app)
        .get('/api/v1/seller/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow SELLER access to seller management routes with 200', async () => {
      const { token } = await createTestSeller();

      const res = await request(app)
        .get('/api/v1/seller/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('metrics');
    });
  });
});
