// tests/unit/put.test.js

const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');

// Mock the Fragment class
jest.mock('../../src/model/fragment');

// Mock the hashEmail function to return the input unchanged for testing
jest.mock('../../src/hash', () => ({
  ...jest.requireActual('../../src/hash'),
  hashEmail: jest.fn((email) => email), // Return email unchanged for tests
}));

describe('PUT /v1/fragments/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Fragment.isSupportedType to return true for supported types
    Fragment.isSupportedType = jest.fn((type) => {
      const supportedTypes = ['text/plain', 'text/html', 'application/json', 'image/png', 'image/jpeg'];
      return supportedTypes.includes(type);
    });
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app)
      .put('/v1/fragments/test-id-123')
      .set('Content-Type', 'text/plain')
      .send('updated data');
    
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .put('/v1/fragments/test-id-123')
      .auth('invalid@email.com', 'incorrect_password')
      .set('Content-Type', 'text/plain')
      .send('updated data');
    
    expect(res.statusCode).toBe(401);
  });

  test('returns 404 for non-existent fragment', async () => {
    Fragment.byId = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated data');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('returns 415 for missing Content-Type header', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      update: jest.fn(),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1')
      .send('updated data');
    
    expect(res.statusCode).toBe(415);
  });

  test('returns 415 for unsupported content type', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      update: jest.fn(),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send('updated data');
    
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported content type: image/gif');
  });

  test('returns 400 for empty request body', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      update: jest.fn(),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');
    
    expect(res.statusCode).toBe(400);
  });

  test('updates fragment with text/plain content', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 12,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-02T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-123',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 12,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-02T00:00:00.000Z',
      }),
      update: jest.fn().mockResolvedValue(),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated data');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe('test-id-123');
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(12);
    expect(mockFragment.update).toHaveBeenCalledWith(
      expect.any(Buffer),
      'text/plain'
    );
  });

  test('updates fragment with different content type', async () => {
    const mockFragment = {
      id: 'test-id-456',
      ownerId: 'user1@email.com',
      type: 'text/html',
      size: 20,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-02T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-456',
        ownerId: 'user1@email.com',
        type: 'text/html',
        size: 20,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-02T00:00:00.000Z',
      }),
      update: jest.fn().mockResolvedValue(),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-456')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<p>updated data</p>');

    expect(res.statusCode).toBe(200);
    expect(res.body.fragment.type).toBe('text/html');
    expect(mockFragment.update).toHaveBeenCalledWith(
      expect.any(Buffer),
      'text/html'
    );
  });

  test('updates fragment with image content', async () => {
    const imageData = Buffer.from('fake image data');
    const mockFragment = {
      id: 'test-id-789',
      ownerId: 'user1@email.com',
      type: 'image/png',
      size: imageData.length,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-02T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-789',
        ownerId: 'user1@email.com',
        type: 'image/png',
        size: imageData.length,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-02T00:00:00.000Z',
      }),
      update: jest.fn().mockResolvedValue(),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-789')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imageData);

    expect(res.statusCode).toBe(200);
    expect(res.body.fragment.type).toBe('image/png');
    expect(mockFragment.update).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/png'
    );
  });

  test('handles Fragment.update() error', async () => {
    const mockFragment = {
      id: 'test-id-error',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      update: jest.fn().mockRejectedValue(new Error('Update failed')),
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/test-id-error')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated data');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal server error');
  });

  test('returns 404 when fragment belongs to different user', async () => {
    // Fragment exists but belongs to different user
    Fragment.byId = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .put('/v1/fragments/other-user-fragment')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated data');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });
});


