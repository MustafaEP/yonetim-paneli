import { Request, Response } from "express";
import { products, getNextProductId, Product } from "../data/products";

export const getAllProducts = (_req: Request, res: Response) => {
  return res.json({ products });
};

export const getProductById = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  return res.json({ product });
};

export const createProduct = (req: Request, res: Response) => {
  const { name, price, stock } = req.body;

  if (!name || price == null || stock == null) {
    return res
      .status(400)
      .json({ message: "name, price ve stock zorunludur." });
  }

  const now = new Date();

  const newProduct: Product = {
    id: getNextProductId(),
    name,
    price: Number(price),
    stock: Number(stock),
    createdAt: now,
    updatedAt: now,
  };

  products.push(newProduct);

  return res.status(201).json({
    message: "Ürün oluşturuldu.",
    product: newProduct,
  });
};

export const updateProduct = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, price, stock } = req.body;

  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  product.updatedAt = new Date();

  return res.json({
    message: "Ürün güncellendi.",
    product,
  });
};

export const deleteProduct = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  const deleted = products.splice(index, 1)[0];

  return res.json({
    message: "Ürün silindi.",
    product: deleted,
  });
};
