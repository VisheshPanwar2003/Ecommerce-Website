import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import env from '../../src/config/env.js';

describe('Integration: Error Handling & Security Sanitization', () => {
  it('should return 400 with "Invalid JSON payload" on malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": "test@example.com", "password": '); // Malformed JSON

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid json payload/i);
    expect(res.body).not.toHaveProperty('stack');
  });

  it('should return 400 on Zod validation failure with structured field errors', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: 'short'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
    expect(res.body).not.toHaveProperty('stack');
  });

  it('should return 404 for unknown endpoints without stack trace', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint-404');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
    expect(res.body).not.toHaveProperty('stack');
  });

  it('should never expose DATABASE_URL or JWT_SECRET anywhere in response body or headers', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-for-secrets');

    const resString = JSON.stringify(res.body);
    const headersString = JSON.stringify(res.headers);

    if (env.DATABASE_URL) {
      expect(resString).not.toContain(env.DATABASE_URL);
      expect(headersString).not.toContain(env.DATABASE_URL);
    }
    if (env.JWT_SECRET) {
      expect(resString).not.toContain(env.JWT_SECRET);
      expect(headersString).not.toContain(env.JWT_SECRET);
    }
  });
});
