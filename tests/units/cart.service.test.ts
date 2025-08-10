import CartService from '../../src/services/cart.service';
import { prisma } from '../setup';
import ApiError from '../../src/utils/apiError';
import { UlidHelper, EntityPrefix } from '../../src/utils/ulid.helper';
import { User, Category, Product } from '@prisma/client';

describe('CartService', () => {
  let cartService: CartService;
  let testUser: User;
  let testUser2: User;
  let testCategory: Category;
  let testProduct: Product;
  let testProduct2: Product;

  beforeEach(async () => {
    cartService = new CartService();

    // Create test users
    testUser = await prisma.user.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.USER),
        email: 'test@example.com',
        name: 'Test User',
        password: 'P@ssw0rd123',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.USER),
        email: 'test2@example.com',
        name: 'Test User 2',
        password: 'P@ssw0rd123',
      },
    });

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CATEGORY),
        name: 'Electronics',
      },
    });

    // Create test products
    testProduct = await prisma.product.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.PRODUCT),
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'A test product',
        price: 100.0,
        unitPrice: BigInt(10000),
        stockLevel: 10,
        createdBy: testUser2.id,
        categoryId: testCategory.id,
      },
    });

    testProduct2 = await prisma.product.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.PRODUCT),
        sku: 'TEST-002',
        name: 'Test Product 2',
        description: 'Another test product',
        price: 50.0,
        unitPrice: BigInt(5000),
        stockLevel: 5,
        createdBy: testUser.id,
        categoryId: testCategory.id,
      },
    });
  });

  describe('getCart', () => {
    it('should return empty cart for new user', async () => {
      const cart = await cartService.getCart(testUser.id);

      expect(cart).toEqual({
        id: expect.any(String),
        items: [],
        subtotalKobo: 0,
        subtotalNaira: 0,
      });
    });

    it('should return cart with items', async () => {
      await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 2,
      });

      const cart = await cartService.getCart(testUser.id);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject({
        productId: testProduct.id,
        sku: 'TEST-001',
        name: 'Test Product',
        price: 100.0,
        quantity: 2,
        itemTotalKobo: 20000,
        itemTotalNaira: 200.0,
      });
      expect(cart.subtotalKobo).toBe(20000);
      expect(cart.subtotalNaira).toBe(200.0);
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const cart = await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 2,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.subtotalKobo).toBe(20000);
    });

    it('should update quantity when adding existing item', async () => {
      await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 2,
      });

      const cart = await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 3,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.subtotalKobo).toBe(50000);
    });

    it('should throw error for invalid quantity', async () => {
      await expect(
        cartService.addItem(testUser.id, {
          productId: testProduct.id,
          quantity: 0,
        })
      ).rejects.toThrow(ApiError);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        cartService.addItem(testUser.id, {
          productId: 'non-existent-id',
          quantity: 1,
        })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when exceeding stock level', async () => {
      await expect(
        cartService.addItem(testUser.id, {
          productId: testProduct.id,
          quantity: 15,
        })
      ).rejects.toThrow('Requested quantity (15) exceeds available stock (10)');
    });

    it('should prevent user from adding their own product', async () => {
      await expect(
        cartService.addItem(testUser.id, {
          productId: testProduct2.id,
          quantity: 1,
        })
      ).rejects.toThrow('You cannot add your own products to your cart');
    });

    it('should throw error when adding to existing item exceeds stock', async () => {
      await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 8,
      });

      await expect(
        cartService.addItem(testUser.id, {
          productId: testProduct.id,
          quantity: 5,
        })
      ).rejects.toThrow('Requested quantity (13) exceeds available stock (10)');
    });
  });

  describe('updateItemQuantity', () => {
    beforeEach(async () => {
      await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 3,
      });
    });

    it('should update item quantity', async () => {
      const cart = await cartService.updateItemQuantity(testUser.id, testProduct.id, {
        quantity: 5,
      });

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.subtotalKobo).toBe(50000);
    });

    it('should throw error for invalid quantity', async () => {
      await expect(
        cartService.updateItemQuantity(testUser.id, testProduct.id, {
          quantity: 0,
        })
      ).rejects.toThrow('Quantity must be at least 1');
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        cartService.updateItemQuantity(testUser.id, 'non-existent-id', {
          quantity: 2,
        })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error for non-existent cart item', async () => {
      const anotherProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-003',
          name: 'Another Product',
          description: 'Another test product',
          price: 75.0,
          unitPrice: BigInt(7500),
          stockLevel: 8,
          createdBy: testUser2.id,
          categoryId: testCategory.id,
        },
      });

      await expect(
        cartService.updateItemQuantity(testUser.id, anotherProduct.id, {
          quantity: 2,
        })
      ).rejects.toThrow('Item not found in cart');
    });

    it('should throw error when quantity exceeds stock', async () => {
      await expect(
        cartService.updateItemQuantity(testUser.id, testProduct.id, {
          quantity: 15,
        })
      ).rejects.toThrow('Requested quantity (15) exceeds available stock (10)');
    });
  });

  describe('removeItem', () => {
    beforeEach(async () => {
      await cartService.addItem(testUser.id, {
        productId: testProduct.id,
        quantity: 2,
      });
    });

    it('should remove item from cart', async () => {
      const cart = await cartService.removeItem(testUser.id, testProduct.id);

      expect(cart.items).toHaveLength(0);
      expect(cart.subtotalKobo).toBe(0);
    });

    it('should throw error for non-existent cart item', async () => {
      const anotherProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-004',
          name: 'Another Product',
          description: 'Another test product',
          price: 25.0,
          unitPrice: BigInt(2500),
          stockLevel: 3,
          createdBy: testUser2.id,
          categoryId: testCategory.id,
        },
      });

      await expect(cartService.removeItem(testUser.id, anotherProduct.id)).rejects.toThrow(
        'Item not found in cart'
      );
    });

    it('should handle removing item from cart with multiple items', async () => {
      const anotherProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-005',
          name: 'Second Product',
          description: 'Second test product',
          price: 30.0,
          unitPrice: BigInt(3000),
          stockLevel: 7,
          createdBy: testUser2.id,
          categoryId: testCategory.id,
        },
      });

      await cartService.addItem(testUser.id, {
        productId: anotherProduct.id,
        quantity: 1,
      });

      const cart = await cartService.removeItem(testUser.id, testProduct.id);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe(anotherProduct.id);
      expect(cart.subtotalKobo).toBe(3000);
    });
  });
});
