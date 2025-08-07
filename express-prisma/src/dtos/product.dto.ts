export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stockLevel: number;
  categoryId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stockLevel?: number;
  categoryId?: string;
}

export interface ProductQueryDto {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categoryId?: string;
  search?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  inStock?: boolean | string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProductDto:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - stockLevel
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           description: Product name
 *           example: "MacBook Pro 16-inch"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "Apple MacBook Pro with M2 chip, 16GB RAM, 512GB SSD"
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *           example: 2499.99
 *         stockLevel:
 *           type: integer
 *           description: Available stock quantity
 *           example: 50
 *         categoryId:
 *           type: string
 *           description: Category ID the product belongs to
 *           example: "cat_01HXYZ1234567890ABCDEF"
 *     UpdateProductDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Product name
 *           example: "MacBook Pro 16-inch"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "Apple MacBook Pro with M2 chip, 16GB RAM, 512GB SSD"
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *           example: 2499.99
 *         stockLevel:
 *           type: integer
 *           description: Available stock quantity
 *           example: 50
 *         categoryId:
 *           type: string
 *           description: Category ID the product belongs to
 *           example: "cat_01HXYZ1234567890ABCDEF"
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Product unique identifier
 *           example: "prd_01HXYZ1234567890ABCDEF"
 *         sku:
 *           type: string
 *           description: Product SKU
 *           example: "LAPTOP-001"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "MacBook Pro 16-inch"
 *         description:
 *           type: string
 *           description: Product description
 *           example: "Apple MacBook Pro with M2 chip, 16GB RAM, 512GB SSD"
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *           example: 2499.99
 *         unitPrice:
 *           type: integer
 *           description: Unit price in smallest currency unit (kobo for NGN)
 *           example: 249999
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: "NGN"
 *         stockLevel:
 *           type: integer
 *           description: Available stock quantity
 *           example: 50
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Product last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         createdBy:
 *           type: string
 *           description: Name of user who created the product
 *           example: "John Doe"
 *         category:
 *           type: string
 *           description: Category name
 *           example: "Electronics"
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Category unique identifier
 *           example: "cat_01HXYZ1234567890ABCDEF"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Electronics"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Category last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *     ProductsResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Products retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *     ProductResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Product created successfully"
 *         data:
 *           $ref: '#/components/schemas/Product'
 */