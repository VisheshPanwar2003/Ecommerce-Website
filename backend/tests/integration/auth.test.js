import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import { cleanDatabase } from '../helpers/db.helper.js';
import { createTestUser, getUniqueId } from '../helpers/auth.helper.js';

describe('Integration: Authentication & Authorization Flow', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('1. Valid registration -> 201 with safe user data', async () => {
      const uid = getUniqueId();
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: `jane_${uid}@example.com`,
          password: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(`jane_${uid}@example.com`);
      expect(res.body.data.user.role).toBe('CUSTOMER');
    });

    it('2. Duplicate email registration -> 409 Conflict', async () => {
      const uid = getUniqueId();
      const email = `dup_${uid}@example.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'First User',
          email,
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Second User',
          email,
          password: 'Password123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('3. Password must be stored as a bcrypt hash in database', async () => {
      const uid = getUniqueId();
      const email = `hash_${uid}@example.com`;
      const rawPassword = 'Password123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Hash User',
          email,
          password: rawPassword
        });

      const dbUser = await prisma.user.findUnique({ where: { email } });
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(rawPassword);
      expect(dbUser.password).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('4. Client cannot register as ADMIN or SELLER (forces CUSTOMER)', async () => {
      const uid = getUniqueId();
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Hacker User',
          email: `hacker_${uid}@example.com`,
          password: 'Password123!',
          role: 'ADMIN' // attempting privilege escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('CUSTOMER');

      const dbUser = await prisma.user.findUnique({
        where: { email: `hacker_${uid}@example.com` }
      });
      expect(dbUser.role).toBe('CUSTOMER');
    });

    it('5. Password hash is never returned in API responses', async () => {
      const uid = getUniqueId();
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Safe User',
          email: `safe_${uid}@example.com`,
          password: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('$2b$');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('6. Correct credentials -> 200 + signed JWT', async () => {
      const { user, rawPassword } = await createTestUser({
        password: 'ValidPassword123!'
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: rawPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('7. Wrong password -> 401 Unauthorized', async () => {
      const { user } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('8. Unknown email -> 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent_user_12345@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('9. Suspended account -> 403 Forbidden', async () => {
      const { user, rawPassword } = await createTestUser({
        status: 'SUSPENDED',
        password: 'Password123!'
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: rawPassword
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/account is suspended/i);
    });
  });

  describe('Protected Route Token Verification', () => {
    it('10. Missing token -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing authorization header/i);
    });

    it('11. Invalid token -> 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('12. Valid token -> 200 Success with current user profile', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.role).toBe(user.role);
    });
  });
});
