import { CartItem, Product } from '@prisma/client';

export type CartItemWithProduct = CartItem & {
  product: Product;
};

export interface CartViewItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  unitPrice: number;
  currency: string;
  quantity: number;
  lineTotal: number;
  lineTotalNaira: number;
}

export interface CartView {
  id: string;
  items: CartViewItem[];
  subtotal: number;
  subtotalNaira: number;
}