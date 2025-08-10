import request from 'supertest';
import { Express } from 'express';
import { UlidHelper, EntityPrefix } from '../../src/utils/ulid.helper';
import { prisma } from '../setup';

import app from '../../src/app';
import { Product, Category, User } from '@prisma/client';

describe('Cart API Integration Tests', () => {
  let testApp: Express;
  let authToken: string;
  let authToken2: string;
  let testUser: User;
  let testUser2: User;
  let testCategory: Category;
  let testProduct: Product;
  let testProduct2: Product;

  beforeAll(async () => {
    testApp = app;
  });

  beforeEach(async () => {
    // register users via API to get cookies
    const email1 = `cart1_${Date.now()}@example.com`;
    const email2 = `cart2_${Date.now()}@example.com`;

    const regResp1 = await request(testApp)
      .post('/api/v1/auth/register')
      .send({ name: 'Cart Test User', email: email1, password: 'P@ssw0rd123' });

    const regResp2 = await request(testApp).post('/api/v1/auth/register').send({
      name: 'Cart Test User 2',
      email: email2,
      password: 'P@ssw0rd123',
    });

    testUser = {
      id: regResp1.body.data.id,
      name: 'Cart Test User',
      email: email1,
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    testUser2 = {
      id: regResp2.body.data.id,
      name: 'Cart Test User 2',
      email: email2,
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cookieArr1 = regResp1.headers['set-cookie'] as unknown as string[];
    const cookieArr2 = regResp2.headers['set-cookie'] as unknown as string[];
    const cookie1 = cookieArr1.find(c => c.includes('accessToken')) || '';
    const cookie2 = cookieArr2.find(c => c.includes('accessToken')) || '';
    authToken = cookie1.split('=')[1].split(';')[0];
    authToken2 = cookie2.split('=')[1].split(';')[0];

    testCategory = await prisma.category.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CATEGORY),
        name: 'Test Electronics',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.PRODUCT),
        sku: 'API-TEST-001',
        name: 'API Test Product',
        description: 'A product for API testing',
        price: 199.99,
        unitPrice: BigInt(19999),
        stockLevel: 15,
        createdBy: testUser2.id,
        categoryId: testCategory.id,
      },
    });

    testProduct2 = await prisma.product.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.PRODUCT),
        sku: 'API-TEST-002',
        name: 'Own Product',
        description: 'Product owned by test user',
        price: 99.99,
        unitPrice: BigInt(9999),
        stockLevel: 10,
        createdBy: testUser.id,
        categoryId: testCategory.id,
      },
    });
  });

  describe('GET /carts', () => {
    it('should return empty cart for new user', async () => {
      const response = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Cart retrieved successfully',
        data: {
          id: expect.any(String),
          items: [],
          subtotalKobo: 0,
          subtotalNaira: 0,
        },
      });
    });

    it('should require authentication', async () => {
      await request(testApp).get('/api/v1/carts').expect(401);
    });
  });

  describe('POST /carts', () => {
    it('should add item to cart', async () => {
      const response = await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct.id,
          quantity: 3,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Item added to cart successfully',
        data: {
          items: [
            {
              productId: testProduct.id,
              sku: 'API-TEST-001',
              name: 'API Test Product',
              quantity: 3,
              itemTotalKobo: 59997,
              itemTotalNaira: 599.97,
            },
          ],
          subtotalKobo: 59997,
          subtotalNaira: 599.97,
        },
      });
    });

    it('should reject invalid quantity', async () => {
      await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct.id,
          quantity: 0,
        })
        .expect(400);
    });

    it('should reject adding own product', async () => {
      const response = await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct2.id,
          quantity: 1,
        })
        .expect(400);

      expect(response.body.message).toContain(
        'You cannot add your own products to your cart'
      );
    });

    it('should reject quantity exceeding stock', async () => {
      const response = await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct.id,
          quantity: 20,
        })
        .expect(400);

      expect(response.body.message).toContain('exceeds available stock');
    });

    it('should require authentication', async () => {
      await request(testApp)
        .post('/api/v1/carts')
        .send({
          productId: testProduct.id,
          quantity: 1,
        })
        .expect(401);
    });
  });

  describe('PUT /carts/:productId', () => {
    beforeEach(async () => {
      await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct.id,
          quantity: 2,
        });
    });

    it('should update item quantity', async () => {
      const response = await request(testApp)
        .put(`/api/v1/carts/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          quantity: 5,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Cart item updated successfully',
        data: {
          items: [
            {
              productId: testProduct.id,
              quantity: 5,
              itemTotalKobo: 99995,
            },
          ],
          subtotalKobo: 99995,
        },
      });
    });

    it('should reject invalid quantity', async () => {
      await request(testApp)
        .put(`/api/v1/carts/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          quantity: 0,
        })
        .expect(400);
    });

    it('should reject quantity exceeding stock', async () => {
      await request(testApp)
        .put(`/api/v1/carts/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          quantity: 20,
        })
        .expect(400);
    });

    it('should handle non-existent cart item', async () => {
      await request(testApp)
        .put(`/api/v1/carts/${testProduct2.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          quantity: 2,
        })
        .expect(404);
    });
  });

  describe('DELETE /cart/:productId', () => {
    beforeEach(async () => {
      await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct.id,
          quantity: 2,
        });
    });

    it('should remove item from cart', async () => {
      const response = await request(testApp)
        .delete(`/api/v1/carts/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Cart item removed successfully',
        data: {
          items: [],
          subtotalKobo: 0,
          subtotalNaira: 0,
        },
      });
    });

    it('should handle non-existent cart item', async () => {
      await request(testApp)
        .delete(`/api/v1/carts/${testProduct2.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(testApp)
        .delete(`/api/v1/carts/${testProduct.id}`)
        .expect(401);
    });
  });

  describe('Cart isolation between users', () => {
    it('should isolate carts between different users', async () => {
      await request(testApp)
        .post('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          productId: testProduct.id,
          quantity: 2,
        });

      const user2CartResponse = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken2}`])
        .expect(200);

      expect(user2CartResponse.body.data.items).toHaveLength(0);

      const user1CartResponse = await request(testApp)
        .get('/api/v1/carts')
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(200);

      expect(user1CartResponse.body.data.items).toHaveLength(1);
    });
  });
});
