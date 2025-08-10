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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security: []
 *     description: |
 *       Logout the current user by invalidating their refresh token session.
 *       This endpoint is public and only requires a valid refresh token in cookies.
 *       After logout, both access and refresh tokens are cleared from cookies.
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "User logged out successfully"
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *         headers:
 *           Set-Cookie:
 *             description: Access and refresh tokens cleared from cookies
 *             schema:
 *               type: string
 *               example: "accessToken=; HttpOnly; Path=/; Max-Age=0"
 *       401:
 *         description: Unauthorized - no refresh token provided or invalid token
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
 *                   example: "No refresh token provided"
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 */
