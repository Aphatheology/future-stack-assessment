import { Router } from 'express';
import validate from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import * as cartValidation from '../validations/cart.validation';
import * as cartController from '../controllers/cart.controller';

const router = Router();

router
  .route('/')
  .get(authenticate, cartController.getCart)
  .post(authenticate, validate(cartValidation.addItem), cartController.addItem);

router
  .route('/:productId')
  .put(authenticate, validate(cartValidation.updateItem), cartController.updateItem)
  .delete(authenticate, validate(cartValidation.removeItem), cartController.removeItem);

export default router;

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management endpoints
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               status: success
 *               message: Cart retrieved successfully
 *               data:
 *                 id: crt_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 items:
 *                   - productId: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                     sku: ELEC-0FEG-VHD8TK
 *                     name: iPhone 15 Pro
 *                     price: 999.99
 *                     unitPrice: 99999
 *                     currency: NGN
 *                     quantity: 2
 *                     lineTotal: 199998
 *                     lineTotalNaira: 1999.98
 *                 subtotal: 199998
 *                 subtotalNaira: 1999.98
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *
 *   post:
 *     summary: Add an item to the cart
 *     description: Add a product to your cart. You cannot add your own products to your cart.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCartItemDto'
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               status: success
 *               message: Item added to cart successfully
 *               data:
 *                 id: crt_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 items:
 *                   - productId: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                     sku: ELEC-0FEG-VHD8TK
 *                     name: iPhone 15 Pro
 *                     price: 999.99
 *                     unitPrice: 99999
 *                     currency: NGN
 *                     quantity: 2
 *                     lineTotal: 199998
 *                     lineTotalNaira: 1999.98
 *                 subtotal: 199998
 *                 subtotalNaira: 1999.98
 *       400:
 *         description: Bad request - validation error, insufficient stock, or own product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficient_stock:
 *                 summary: Insufficient stock
 *                 value:
 *                   status: error
 *                   message: Requested quantity (5) exceeds available stock (3)
 *               own_product:
 *                 summary: Cannot add own product
 *                 value:
 *                   status: error
 *                   message: You cannot add your own products to your cart
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
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
 * /cart/{productId}:
 *   put:
 *     summary: Update quantity of a cart item
 *     description: Update the quantity of an item in your cart.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "prd_01K1XAVQNJ9CFYC5TXCRE2S56Z"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemDto'
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               status: success
 *               message: Cart item updated successfully
 *               data:
 *                 id: crt_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 items:
 *                   - productId: prd_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                     sku: ELEC-0FEG-VHD8TK
 *                     name: iPhone 15 Pro
 *                     price: 999.99
 *                     unitPrice: 99999
 *                     currency: NGN
 *                     quantity: 3
 *                     lineTotal: 299997
 *                     lineTotalNaira: 2999.97
 *                 subtotal: 299997
 *                 subtotalNaira: 2999.97
 *       400:
 *         description: Bad request - validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Requested quantity (10) exceeds available stock (5)
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *       404:
 *         description: Product or cart item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Item not found in cart
 *
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "prd_01K1XAVQNJ9CFYC5TXCRE2S56Z"
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               status: success
 *               message: Cart item removed successfully
 *               data:
 *                 id: crt_01K1XAVQNJ9CFYC5TXCRE2S56Z
 *                 items: []
 *                 subtotal: 0
 *                 subtotalNaira: 0
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid token! Please authenticate
 *       404:
 *         description: Cart item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Item not found in cart
 */