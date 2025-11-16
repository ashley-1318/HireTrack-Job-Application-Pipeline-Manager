import request from 'supertest';
import app from '../app.js';
import { describe, it, expect } from 'vitest';

// Use default env-based admin (from .env.example values)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'supersecurepassword';

describe('Auth flow', () => {
  it('fails login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: 'bad' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('blocks protected route without token', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'Test Job', description: 'Desc' });
    expect(res.status).toBe(401);
  });

  it('accesses protected /api/auth/me with valid token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const token = login.body.token;
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(ADMIN_EMAIL);
    expect(me.body.role).toBe('admin');
  });
});
