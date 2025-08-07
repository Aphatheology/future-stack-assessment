import { Product, Category, User } from '@prisma/client';

export type ProductWithRelations = Product & {
  category: Pick<Category, 'name'>;
  creator: Pick<User, 'name'>;
};

export interface TransformedProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  unitPrice: number;
  currency: string;
  stockLevel: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  category: string;
}
