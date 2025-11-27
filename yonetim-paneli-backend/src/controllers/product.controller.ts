import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
    });
    return res.json({ products });
  } catch (err) {
    console.error("getAllProducts error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    return res.json({ product });
  } catch (err) {
    console.error("getProductById error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock } = req.body;

    if (!name || price == null || stock == null) {
      return res
        .status(400)
        .json({ message: "name, price ve stock zorunludur." });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        stock: Number(stock),
      },
    });

    return res.status(201).json({
      message: "Ürün oluşturuldu.",
      product: newProduct,
    });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, price, stock } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? product.name,
        price: price != null ? Number(price) : product.price,
        stock: stock != null ? Number(stock) : product.stock,
      },
    });

    return res.json({
      message: "Ürün güncellendi.",
      product: updated,
    });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    const deleted = await prisma.product.delete({
      where: { id },
    });

    return res.json({
      message: "Ürün silindi.",
      product: deleted,
    });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};
