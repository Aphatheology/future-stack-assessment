import { StatusCodes } from 'http-status-codes';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../dtos/product.dto';
import { UlidHelper, EntityPrefix } from '../utils/ulid.helper';
import ApiError from '../utils/apiError';
import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { NGNCurrencyUtils } from '../utils/ngn-currency';
import { SkuHelper } from '../utils/sku-helper';
import { PaginationResult } from '../types/pagination.type';
import { ProductWithRelations, TransformedProduct } from '../types/product.type';

export default class ProductService {
  private readonly skuHelper: SkuHelper;

  constructor() {
    this.skuHelper = new SkuHelper(prisma);
  }

  private parseNumber(value: string | number | undefined, min: number, max: number, defaultValue: number): number {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : Math.min(max, Math.max(min, parsed));
    }
    return value || defaultValue;
  }

  private parseFloat(value: string | number | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return value;
  }

  private parseBoolean(value: string | boolean | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    return typeof value === 'string' ? value === 'true' : value;
  }

  private parseQueryParams(queryDto: ProductQueryDto): {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  } {
    return {
      page: this.parseNumber(queryDto.page, 1, Infinity, 1),
      limit: this.parseNumber(queryDto.limit, 1, 100, 10),
      sortBy: queryDto.sortBy || 'createdAt',
      sortOrder: (queryDto.sortOrder as 'asc' | 'desc') || 'desc',
      categoryId: queryDto.categoryId,
      search: queryDto.search,
      minPrice: this.parseFloat(queryDto.minPrice),
      maxPrice: this.parseFloat(queryDto.maxPrice),
      inStock: this.parseBoolean(queryDto.inStock)
    };
  }

  private transformProduct(product: ProductWithRelations): TransformedProduct {
    return {
      ...product,
      unitPrice: Number(product.unitPrice),
      createdBy: product.creator?.name || product.createdBy,
      category: product.category?.name || product.category,
      creator: undefined,
      categoryId: undefined
    } as TransformedProduct;
  }

  private transformProducts(products: ProductWithRelations[]): TransformedProduct[] {
    return products.map(product => this.transformProduct(product));
  }

  private async checkIdempotencyKey(idempotencyKey: string, userId: string): Promise<TransformedProduct | null> {
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
      include: {
        product: {
          include: {
            category: {
              select: { name: true }
            },
            creator: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (existingKey && existingKey.userId === userId && existingKey.product) {
      return this.transformProduct(existingKey.product);
    }

    return null;
  }

  private async checkDuplicateProduct(userId: string, name: string, price: number): Promise<void> {
    const existingProduct = await prisma.product.findFirst({
      where: {
        createdBy: userId,
        name: name,
        price: price
      }
    });

    if (existingProduct) {
      throw new ApiError(StatusCodes.CONFLICT, 'A product with the same name and price already exists');
    }
  }

  private async storeIdempotencyKey(idempotencyKey: string, userId: string, productId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.idempotencyKey.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.IDEMPOTENCY_KEY),
        key: idempotencyKey,
        userId: userId,
        productId: productId,
        expiresAt: expiresAt
      }
    });
  }

  private async cleanupExpiredIdempotencyKeys(): Promise<void> {
    const now = new Date();
    await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
  }

  async createProduct(userId: string, createProductDto: CreateProductDto, idempotencyKey?: string): Promise<TransformedProduct> {
    const { name, description, price, stockLevel, categoryId } = createProductDto;

    if (idempotencyKey) {
      const existingProduct = await this.checkIdempotencyKey(idempotencyKey, userId);
      if (existingProduct) {
        return existingProduct;
      }
    }

    await this.checkDuplicateProduct(userId, name, price);

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
    }

    const productId = UlidHelper.generate(EntityPrefix.PRODUCT);
    const unitPrice = NGNCurrencyUtils.nairaToKobo(price);
    const sku = await this.skuHelper.generateProductSku(categoryId, userId);

    const product = await prisma.product.create({
      data: {
        id: productId,
        sku,
        name,
        description,
        price,
        unitPrice,
        stockLevel,
        createdBy: userId,
        categoryId,
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            name: true
          }
        }
      }
    });

    if (idempotencyKey) {
      await this.storeIdempotencyKey(idempotencyKey, userId, productId);
    }

    return this.transformProduct(product);
  }

  async getProducts(queryDto: ProductQueryDto): Promise<PaginationResult<TransformedProduct>> {
    const { page, limit, sortBy, sortOrder, categoryId, search, minPrice, maxPrice, inStock } = this.parseQueryParams(queryDto);

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock === true) {
      where.stockLevel = { gt: 0 };
    } else if (inStock === false) {
      where.stockLevel = { equals: 0 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              name: true
            }
          },
          creator: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return {
      data: this.transformProducts(products),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserProducts(userId: string, queryDto: ProductQueryDto): Promise<PaginationResult<TransformedProduct>> {
    const { page, limit, sortBy, sortOrder, categoryId, search, minPrice, maxPrice, inStock } = this.parseQueryParams(queryDto);

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      createdBy: userId
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock === true) {
      where.stockLevel = { gt: 0 };
    } else if (inStock === false) {
      where.stockLevel = { equals: 0 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              name: true
            }
          },
          creator: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return {
      data: this.transformProducts(products),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(productId: string): Promise<TransformedProduct> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            name: true
          }
        }
      }
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }

    return this.transformProduct(product);
  }

  async updateProduct(productId: string, userId: string, updateProductDto: UpdateProductDto): Promise<TransformedProduct> {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }

    if (existingProduct.createdBy !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You can only update your own products");
    }

    if (updateProductDto.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateProductDto.categoryId }
      });
      if (!category) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Category not found");
      }
    }

    const updateData: Prisma.ProductUpdateInput = { ...updateProductDto };
    
    if (updateProductDto.price !== undefined) {
      updateData.unitPrice = NGNCurrencyUtils.nairaToKobo(updateProductDto.price);
    }

    // If category is being changed, generate a new SKU
    if (updateProductDto.categoryId && updateProductDto.categoryId !== existingProduct.categoryId) {
      const newSku = await this.skuHelper.generateProductSku(updateProductDto.categoryId, userId);
      updateData.sku = newSku;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            name: true
          }
        }
      }
    });

    return this.transformProduct(product);
  }

  async deleteProduct(productId: string, userId: string): Promise<void> {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }

    if (existingProduct.createdBy !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You can only delete your own products");
    }

    // Check if product is in use by cart items and email the user
    // Make the delete a soft delete, and notify the user that the product has been deleted

    await prisma.product.delete({
      where: { id: productId }
    });
  }
}