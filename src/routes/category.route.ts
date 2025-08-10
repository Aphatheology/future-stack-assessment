import { Router } from 'express';
import { getCategories } from '../controllers/category.controller';

const router = Router();

router.get('/', getCategories);

export default router;

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product categories management endpoints
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: cat_01H7N...
 *                       name:
 *                         type: string
 *                         example: Electronics
 *             example:
 *               status: success
 *               message: Categories retrieved successfully
 *               data:
 *                 - id: cat_01H7N...
 *                   name: Electronics
 *                 - id: cat_01H7M...
 *                   name: Books
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
