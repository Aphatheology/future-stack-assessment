import { Router } from "express";
import validate from '../middlewares/validate';
import { authLimiter } from '../middlewares/rateLimiter';
import * as userValidation from '../validations/auth.validation'
import * as authController from '../controllers/auth.controller'

const router = Router();

router
  .route("/register")
  .post(authLimiter, validate(userValidation.register), authController.register);

router
  .route("/login")
  .post(authLimiter, validate(userValidation.login), authController.login);

router
  .route("/refresh-token")
  .post(authController.refreshToken);

router
  .route("/logout")
  .post(authController.logout);

export default router;

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: Access and refresh tokens set as HTTP-only cookies
 *             schema:
 *               type: string
 *               example: "accessToken=eyJ...; HttpOnly; Path=/; SameSite=Strict"
 *       400:
 *         description: Bad request - validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Email already registered"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDto'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: Access and refresh tokens set as HTTP-only cookies
 *             schema:
 *               type: string
 *               example: "accessToken=eyJ...; HttpOnly; Path=/; SameSite=Strict"
 *       401:
 *         description: Unauthorized - incorrect email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Incorrect email or password"
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: New access and refresh tokens set as HTTP-only cookies
 *             schema:
 *               type: string
 *               example: "accessToken=eyJ...; HttpOnly; Path=/; SameSite=Strict"
 *       401:
 *         description: Unauthorized - invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid refresh token"
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 */
