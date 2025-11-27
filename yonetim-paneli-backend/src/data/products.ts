export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export const products: Product[] = [];

let currentProductId = 1;
export const getNextProductId = () => currentProductId++;
