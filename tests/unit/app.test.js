// tests/unit/app.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('App 404 handler', () => {
  test('returns 404 json for unknown routes', async () => {
    const res = await request(app).get('/not-a-real-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error && res.body.error.code).toBe(404);
    expect(res.body.error && res.body.error.message).toBe('not found');
  });
});


