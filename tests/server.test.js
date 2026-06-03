const request = require('supertest');
const { app, server } = require('../src/server');

afterAll(() => server.close());

describe('Health endpoints', () => {
  test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  test('GET /ready returns ready', async () => {
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});

describe('Items API', () => {
  test('GET /api/items returns empty list', async () => {
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('POST /api/items creates item', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'test-item' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('test-item');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/items without name returns 400', async () => {
    const res = await request(app).post('/api/items').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('name is required');
  });
});