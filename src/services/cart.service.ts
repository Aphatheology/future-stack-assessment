import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma';
import ApiError from '../utils/apiError';
import { UlidHelper, EntityPrefix } from '../utils/ulid.helper';
import { AddCartItemDto, UpdateCartItemDto } from '../dtos/cart.dto';
import { CartItemWithProduct, CartView, CartViewItem } from '../types/cart.type';
import { NGNCurrencyUtils } from '../utils/ngn-currency';

export default class CartService {
  private async getOrCreateUserCart(userId: string) {
    let cart = await prisma.cart.findFirst({
      where: { createdBy: userId },
    });

    cart ??= await prisma.cart.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CART),
        createdBy: userId,
      },
    });
    return cart;
  }

  private transformCartItems(items: CartItemWithProduct[]): CartViewItem[] {
    return items.map(item => {
      const itemTotalKobo = Number(item.product.unitPrice) * item.quantity;
      return {
        productId: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        price: item.product.price,
        unitPrice: Number(item.product.unitPrice),
        currency: item.product.currency,
        quantity: item.quantity,
        itemTotalKobo,
        itemTotalNaira: NGNCurrencyUtils.koboToNaira(BigInt(itemTotalKobo)),
      };
    });
  }

  private buildCartView(cartId: string, items: CartItemWithProduct[]): CartView {
    const transformedItems = this.transformCartItems(items);
    const subtotalKobo = transformedItems.reduce((sum, item) => sum + item.itemTotalKobo, 0);

    return {
      id: cartId,
      items: transformedItems,
      subtotalKobo,
      subtotalNaira: NGNCurrencyUtils.koboToNaira(BigInt(subtotalKobo)),
    };
  }

  async getCart(userId: string): Promise<CartView> {
    const cart = await this.getOrCreateUserCart(userId);

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    return this.buildCartView(cart.id, items as CartItemWithProduct[]);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartView> {
    const { productId, quantity } = dto;

    if (quantity < 1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity must be at least 1');
    }

    const [cart, product] = await Promise.all([
      this.getOrCreateUserCart(userId),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    if (product.createdBy === userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot add your own products to your cart');
    }

    await prisma.$transaction(async tx => {
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      const newQuantity = (existingCartItem?.quantity || 0) + quantity;

      if (newQuantity > product.stockLevel) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Requested quantity (${newQuantity}) exceeds available stock (${product.stockLevel})`
        );
      }

      if (existingCartItem) {
        await tx.cartItem.update({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
          data: { quantity: newQuantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            id: UlidHelper.generate(EntityPrefix.CART_ITEM),
            cartId: cart.id,
            productId,
            quantity: newQuantity,
          },
        });
      }
    });

    const updatedItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    return this.buildCartView(cart.id, updatedItems as CartItemWithProduct[]);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto
  ): Promise<CartView> {
    const { quantity } = dto;

    if (quantity < 1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity must be at least 1');
    }

    const cart = await this.getOrCreateUserCart(userId);

    const [product, existingCartItem] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      }),
    ]);

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    if (!existingCartItem) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Item not found in cart');
    }

    if (quantity > product.stockLevel) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Requested quantity (${quantity}) exceeds available stock (${product.stockLevel})`
      );
    }

    await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      data: { quantity },
    });

    const updatedItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    return this.buildCartView(cart.id, updatedItems as CartItemWithProduct[]);
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    const cart = await this.getOrCreateUserCart(userId);

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingCartItem) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Item not found in cart');
    }

    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const updatedItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    return this.buildCartView(cart.id, updatedItems as CartItemWithProduct[]);
  }
}
