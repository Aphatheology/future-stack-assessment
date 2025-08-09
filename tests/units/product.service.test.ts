import ProductService from '../../src/services/product.service';
import { prisma } from '../setup';
import { UlidHelper, EntityPrefix } from '../../src/utils/ulid.helper';
import { hashPassword } from '../../src/utils/password';

describe('ProductService', () => {
  let productService: ProductService;
  let testUser: any;
  let testUser2: any;
  let testCategory: any;
  let testCategory2: any;

  beforeEach(async () => {
    productService = new ProductService();

    testUser = await prisma.user.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.USER),
        email: 'creator@example.com',
        name: 'Product Creator',
        password: await hashPassword('P@ssw0rd123'),
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.USER),
        email: 'other@example.com',
        name: 'Other User',
        password: await hashPassword('P@ssw0rd123'),
      },
    });

    testCategory = await prisma.category.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CATEGORY),
        name: 'Electronics',
      },
    });

    testCategory2 = await prisma.category.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CATEGORY),
        name: 'Books',
      },
    });
  });

  afterEach(async () => {
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createProduct', () => {
    it('should successfully create a product', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        stockLevel: 10,
        categoryId: testCategory.id,
      };

      const product = await productService.createProduct(testUser.id, createDto);

      expect(product).toMatchObject({
        id: expect.stringMatching(/^prd_/),
        sku: expect.stringMatching(/^ELEC-/),
        name: createDto.name,
        description: createDto.description,
        price: createDto.price,
        unitPrice: createDto.price*100,
        currency: 'NGN',
        stockLevel: createDto.stockLevel,
        createdBy: testUser.name,
        category: testCategory.name,
      });

      const createdProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(createdProduct).toBeTruthy();
    });

    it('should generate unique SKU for each product', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        stockLevel: 10,
        categoryId: testCategory.id,
      };

      const product1 = await productService.createProduct(testUser.id, createDto);
      const product2 = await productService.createProduct(testUser.id, createDto);

      const prefix = 'ELEC-';
      expect(product1.sku.startsWith(prefix)).toBe(true);
      expect(product2.sku.startsWith(prefix)).toBe(true);
      expect(product1.sku).not.toBe(product2.sku);
    });

    it('should correctly convert price to kobo', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'A test product description',
        price: 123.45,
        stockLevel: 10,
        categoryId: testCategory.id,
      };

      const product = await productService.createProduct(testUser.id, createDto);

      expect(product.unitPrice).toBe(12345);
      expect(product.price).toBe(123.45);
    });

    // Negative price or stock level is allowed by service, so no validation tests here.
  });

  describe('getProductById', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          unitPrice: BigInt(9999),
          stockLevel: 10,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
      });
    });

    it('should return product with relations for valid ID', async () => {
      const product = await productService.getProductById(testProduct.id);

      expect(product).toMatchObject({
        id: testProduct.id,
        sku: testProduct.sku,
        name: testProduct.name,
        description: testProduct.description,
        price: testProduct.price,
        stockLevel: testProduct.stockLevel,
        category: testCategory.name,
        createdBy: testUser.name,
      });
    });

    it('should throw error for non-existent ID', async () => {
      const nonExistentId = UlidHelper.generate(EntityPrefix.PRODUCT);
      await expect(productService.getProductById(nonExistentId)).rejects.toThrow('Product not found');
    });

    it('should throw error for invalid ID format', async () => {
      await expect(productService.getProductById('invalid-id')).rejects.toThrow();
    });
  });

  describe('getProducts', () => {
    beforeEach(async () => {
      const products = [
        {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'LAPTOP-001',
          name: 'Gaming Laptop',
          description: 'High performance gaming laptop',
          price: 1500.00,
          unitPrice: BigInt(150000),
          stockLevel: 5,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
        {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'PHONE-001',
          name: 'Smartphone',
          description: 'Latest smartphone model',
          price: 800.00,
          unitPrice: BigInt(80000),
          stockLevel: 0,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
        {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'BOOK-001',
          name: 'Programming Book',
          description: 'Learn programming fundamentals',
          price: 29.99,
          unitPrice: BigInt(2999),
          stockLevel: 20,
          createdBy: testUser2.id,
          categoryId: testCategory2.id,
        },
      ];

      await prisma.product.createMany({ data: products });
    });

    it('should return paginated products with default parameters', async () => {
      const result = await productService.getProducts({});

      expect(result.data.length).toBe(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by category', async () => {
      const result = await productService.getProducts({
        categoryId: testCategory2.id,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].category).toBe(testCategory2.name);
      expect(result.data[0].name).toBe('Programming Book');
    });

    it('should filter by search term', async () => {
      const result = await productService.getProducts({
        search: 'laptop',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Gaming Laptop');
    });

    it('should filter by price range', async () => {
      const result = await productService.getProducts({
        minPrice: 50,
        maxPrice: 900,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Smartphone');
    });

    it('should filter by stock availability', async () => {
      const result = await productService.getProducts({
        inStock: true,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every(p => p.stockLevel > 0)).toBe(true);
    });

    it('should sort by price ascending', async () => {
      const result = await productService.getProducts({
        sortBy: 'price',
        sortOrder: 'asc',
      });

      expect(result.data[0].price).toBeLessThanOrEqual(result.data[1].price);
      expect(result.data[1].price).toBeLessThanOrEqual(result.data[2].price);
    });

    it('should sort by price descending', async () => {
      const result = await productService.getProducts({
        sortBy: 'price',
        sortOrder: 'desc',
      });

      expect(result.data[0].price).toBeGreaterThanOrEqual(result.data[1].price);
      expect(result.data[1].price).toBeGreaterThanOrEqual(result.data[2].price);
    });

    it('should handle pagination correctly', async () => {
      const result = await productService.getProducts({
        page: 1,
        limit: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.total).toBe(3);
    });

    it('should return empty result for non-matching filters', async () => {
      const result = await productService.getProducts({
        search: 'nonexistent',
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('updateProduct', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          unitPrice: BigInt(9999),
          stockLevel: 10,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
      });
    });

    it('should successfully update product by owner', async () => {
      const updateDto = {
        name: 'Updated Product Name',
        description: 'Updated description',
        price: 149.99,
        stockLevel: 15,
      };

      const updatedProduct = await productService.updateProduct(
        testProduct.id,
        testUser.id,
        updateDto
      );

      expect(updatedProduct).toMatchObject({
        id: testProduct.id,
        name: updateDto.name,
        description: updateDto.description,
        price: updateDto.price,
        unitPrice: 14999,
        stockLevel: updateDto.stockLevel,
      });
    });

    it('should throw error when non-owner tries to update', async () => {
      const updateDto = {
        name: 'Updated Product Name',
      };

      await expect(
        productService.updateProduct(testProduct.id, testUser2.id, updateDto)
      ).rejects.toThrow('You can only update your own products');
    });

    it('should throw error for non-existent product', async () => {
      const updateDto = {
        name: 'Updated Product Name',
      };

      const nonExistentId = UlidHelper.generate(EntityPrefix.PRODUCT);
      await expect(
        productService.updateProduct(nonExistentId, testUser.id, updateDto)
      ).rejects.toThrow('Product not found');
    });

    it('should update only provided fields', async () => {
      const originalName = testProduct.name;
      const updateDto = {
        stockLevel: 25,
      };

      const updatedProduct = await productService.updateProduct(
        testProduct.id,
        testUser.id,
        updateDto
      );

      expect(updatedProduct.name).toBe(originalName); // Should remain unchanged
      expect(updatedProduct.stockLevel).toBe(25); // Should be updated
    });

    it('should throw error for non-existent category in update', async () => {
      const updateDto = {
        categoryId: UlidHelper.generate(EntityPrefix.CATEGORY),
      };

      await expect(
        productService.updateProduct(testProduct.id, testUser.id, updateDto)
      ).rejects.toThrow('Category not found');
    });
  });

  describe('deleteProduct', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          unitPrice: BigInt(9999),
          stockLevel: 10,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
      });
    });

    it('should successfully delete product by owner', async () => {
      await productService.deleteProduct(testProduct.id, testUser.id);

      const deletedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should throw error when non-owner tries to delete', async () => {
      await expect(
        productService.deleteProduct(testProduct.id, testUser2.id)
      ).rejects.toThrow('You can only delete your own products');

      // Verify product still exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
      });
      expect(existingProduct).toBeTruthy();
    });

    it('should throw error for non-existent product', async () => {
      const nonExistentId = UlidHelper.generate(EntityPrefix.PRODUCT);
      await expect(
        productService.deleteProduct(nonExistentId, testUser.id)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very large prices correctly', async () => {
      const createDto = {
        name: 'Expensive Product',
        description: 'Very expensive item',
        price: 999999.99,
        stockLevel: 1,
        categoryId: testCategory.id,
      };

      const product = await productService.createProduct(testUser.id, createDto);

      expect(product.price).toBe(999999.99);
      expect(product.unitPrice).toBe(99999999); // In kobo
    });

    it('should handle zero price correctly', async () => {
      const createDto = {
        name: 'Free Product',
        description: 'Free item',
        price: 0,
        stockLevel: 10,
        categoryId: testCategory.id,
      };

      const product = await productService.createProduct(testUser.id, createDto);

      expect(product.price).toBe(0);
      expect(product.unitPrice).toBe(0);
    });

    it('should handle zero stock level correctly', async () => {
      const createDto = {
        name: 'Out of Stock Product',
        description: 'Currently unavailable',
        price: 99.99,
        stockLevel: 0,
        categoryId: testCategory.id,
      };

      const product = await productService.createProduct(testUser.id, createDto);

      expect(product.stockLevel).toBe(0);
    });
  });
});