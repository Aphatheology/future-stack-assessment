import prisma from '../config/prisma';
import { decodeTime } from 'ulid';
import ApiError from './apiError';
import { StatusCodes } from 'http-status-codes';
import logger from '../config/logger';
import { ulid } from 'ulid';

export class SkuHelper {
  constructor(private prismaInstance = prisma) {}

  async generateProductSku(categoryId: string, userId: string): Promise<string> {
    const [categoryCode, userIdCode] = await Promise.all([
      this.getCategoryCode(categoryId),
      Promise.resolve(this.getUserIdCode(userId)),
    ]);

    const uniqueId = ulid().slice(-6);
    const candidateSku = `${categoryCode}-${userIdCode}-${uniqueId}`;

    const existingProduct = await this.prismaInstance.product.findFirst({
      where: { sku: candidateSku },
    });

    if (existingProduct) {
      const newUniqueId = ulid().slice(-6);
      const newSku = `${categoryCode}-${userIdCode}-${newUniqueId}`;

      logger.warn(`SKU collision (very rare!), using: ${newSku}`);
      return newSku;
    }

    return candidateSku;
  }

  async getCategoryCode(categoryId: string): Promise<string> {
    const category = await this.prismaInstance.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, `Category with id ${categoryId} not found`);
    }

    const categoryMappings: Record<string, string> = {
      Electronics: 'ELEC',
      Clothing: 'CLTH',
      Books: 'BOOK',
      'Home & Garden': 'HOME',
      Sports: 'SPRT',
      Beauty: 'BEAU',
      Automotive: 'AUTO',
      Toys: 'TOYS',
      Health: 'HLTH',
      Food: 'FOOD',
    };

    if (categoryMappings[category.name]) {
      return categoryMappings[category.name];
    }

    const words = category.name.split(' ').filter(word => word.length > 0);

    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase();
    } else {
      const initials = words.map(word => word.charAt(0)).join('');
      return initials.padEnd(4, 'X').substring(0, 4).toUpperCase();
    }
  }

  getUserIdCode(userId: string): string {
    try {
      const ulidPart = userId.split('_')[1];
      if (!ulidPart) {
        throw new Error('Invalid user ID format: missing ULID part');
      }
      decodeTime(ulidPart);
      return ulidPart.slice(-4).toUpperCase();
    } catch {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user ID format: must be a valid ULID');
    }
  }
}
