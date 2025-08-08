export interface AddCartItemDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     AddCartItemDto:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID to add to cart
 *           example: "prd_01K1XAVQNJ9CFYC5TXCRE2S56Z"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity to add to cart
 *           example: 2
 *     UpdateCartItemDto:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: New quantity for the cart item
 *           example: 3
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID
 *           example: "prd_01K1XAVQNJ9CFYC5TXCRE2S56Z"
 *         sku:
 *           type: string
 *           description: Product SKU
 *           example: "ELEC-0FEG-VHD8TK"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "iPhone 15 Pro"
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *           example: 999.99
 *         unitPrice:
 *           type: integer
 *           description: Unit price in smallest currency unit (kobo for NGN)
 *           example: 99999
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: "NGN"
 *         quantity:
 *           type: integer
 *           description: Quantity in cart
 *           example: 2
 *         lineTotal:
 *           type: integer
 *           description: Total price for this line item in smallest currency unit (kobo)
 *           example: 199998
 *         lineTotalNaira:
 *           type: number
 *           format: float
 *           description: Total price for this line item in naira
 *           example: 1999.98
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Cart ID
 *           example: "crt_01K1XAVQNJ9CFYC5TXCRE2S56Z"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         subtotal:
 *           type: integer
 *           description: Total cart subtotal in smallest currency unit (kobo)
 *           example: 199998
 *         subtotalNaira:
 *           type: number
 *           format: float
 *           description: Total cart subtotal in naira
 *           example: 1999.98
 *     CartResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Cart retrieved successfully"
 *         data:
 *           $ref: '#/components/schemas/Cart'
 */