import { Router } from "express";
import validate from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { validateIdempotencyKey } from '../middlewares/idempotency';
import * as productValidation from '../validations/product.validation'
import * as productController from '../controllers/product.controller'

const router = Router();

router
  .route("/")
  .post(authenticate, validateIdempotencyKey, validate(productValidation.createProduct), productController.createProduct)
  .get(validate(productValidation.getProducts), productController.getProducts);

router
  .route("/my-products")
  .get(authenticate, validate(productValidation.getProducts), productController.getUserProducts);

router
  .route("/:productId")
  .get(validate(productValidation.getProduct), productController.getProduct)
  .put(authenticate, validate(productValidation.updateProduct), productController.updateProduct)
  .delete(authenticate, validate(productValidation.deleteProduct), productController.deleteProduct);

export default router;

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (SKU auto-generated)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]+$'
 *           minLength: 1
 *           maxLength: 255
 *         description: Unique key to prevent duplicate requests
 *         example: "create-product-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductDto'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *             example:
 *               status: success
 *               message: Product created successfully
 *               data:
 *                 id: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 sku: ELEC-0FEG-VHD8TK
 *                 name: iPhone 15 Pro
 *                 description: Apple iPhone 15 Pro with A17 Pro chip, 128GB storage
 *                 price: 999.99
 *                 unitPrice: 99999
 *                 currency: NGN
 *                 stockLevel: 25
 *                 createdAt: 2025-08-05T14:41:11.860Z
 *                 updatedAt: 2025-08-05T14:41:11.860Z
 *                 createdBy: John Doe
 *                 category: Electronics
 *       400:
 *         description: Bad request - validation error, missing idempotency key, or invalid idempotency key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     body.categoryId: Invalid ULID format
 *               missing_idempotency_key:
 *                 summary: Missing idempotency key
 *                 value:
 *                   status: error
 *                   message: X-Idempotency-Key header is required
 *               invalid_idempotency_key:
 *                 summary: Invalid idempotency key format
 *                 value:
 *                   status: error
 *                   message: Idempotency key can only contain alphanumeric characters, hyphens, and underscores
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *       409:
 *         description: Conflict - duplicate product with same name and price
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: A product with the same name and price already exists
 *
 *   get:
 *     summary: Get all products (public endpoint with filtering and pagination)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, stockLevel, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name, description, or SKU
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsResponse'
 *             example:
 *               status: success
 *               message: Products retrieved successfully
 *               data:
 *                 data:
 *                   - id: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                     sku: ELEC-0FEG-VHD8TK
 *                     name: iPhone 15 Pro
 *                     description: Apple iPhone 15 Pro with A17 Pro chip, 128GB storage
 *                     price: 999.99
 *                     unitPrice: 99999
 *                     currency: NGN
 *                     stockLevel: 25
 *                     createdAt: 2025-08-05T14:41:11.860Z
 *                     updatedAt: 2025-08-05T14:41:11.860Z
 *                     createdBy: John Doe
 *                     category: Electronics
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 1
 *                   totalPages: 1
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Validation failed
 *               errors:
 *                 query.page: must be greater than or equal to 1
 */

/**
 * @swagger
 * /products/my-products:
 *   get:
 *     summary: Get products created by the logged-in user
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, stockLevel, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name, description, or SKU
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: User products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsResponse'
 *             example:
 *               status: success
 *               message: User products retrieved successfully
 *               data:
 *                 data:
 *                   - id: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                     sku: ELEC-0FEG-VHD8TK
 *                     name: iPhone 15 Pro
 *                     description: Apple iPhone 15 Pro with A17 Pro chip, 128GB storage
 *                     price: 999.99
 *                     unitPrice: 99999
 *                     currency: NGN
 *                     stockLevel: 25
 *                     createdAt: 2025-08-05T14:41:11.860Z
 *                     updatedAt: 2025-08-05T14:41:11.860Z
 *                     createdBy: John Doe
 *                     category: Electronics
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 1
 *                   totalPages: 1
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Validation failed
 *               errors:
 *                 query.page: must be greater than or equal to 1
 */

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *             example:
 *               status: success
 *               message: Product retrieved successfully
 *               data:
 *                 id: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 sku: ELEC-0FEG-VHD8TK
 *                 name: iPhone 15 Pro
 *                 description: Apple iPhone 15 Pro with A17 Pro chip, 128GB storage
 *                 price: 999.99
 *                 unitPrice: 99999
 *                 currency: NGN
 *                 stockLevel: 25
 *                 createdAt: 2025-08-05T14:41:11.860Z
 *                 updatedAt: 2025-08-05T14:41:11.860Z
 *                 createdBy: John Doe
 *                 category: Electronics
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Product not found
 */

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     summary: Update a product (SKU regenerated if category changes)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDto'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *             example:
 *               status: success
 *               message: Product updated successfully
 *               data:
 *                 id: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 sku: ELEC-0FEG-VHD8TK
 *                 name: iPhone 15 Pro
 *                 description: Apple iPhone 15 Pro with A17 Pro chip, 128GB storage
 *                 price: 999.99
 *                 unitPrice: 99999
 *                 currency: NGN
 *                 stockLevel: 25
 *                 createdAt: 2025-08-05T14:41:11.860Z
 *                 updatedAt: 2025-08-05T14:41:11.860Z
 *                 createdBy: John Doe
 *                 category: Electronics
 *       400:
 *         description: Bad request - validation error or duplicate SKU
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Validation failed
 *               errors:
 *                 body.sku: SKU already in use
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *       403:
 *         description: Forbidden - can only update your own products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: You can only update your own products
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Product not found
 */

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *         content: []
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *       403:
 *         description: Forbidden - can only delete your own products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: You can only delete your own products
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Product not found
 */