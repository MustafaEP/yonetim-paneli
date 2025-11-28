import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logActivity } from "../services/activityLog.service";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string | undefined) || "";
    const minPrice = req.query.minPrice
      ? Number(req.query.minPrice)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? Number(req.query.maxPrice)
      : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      page,
      limit,
      total,
      products,
    });
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

    // LOG
    await logActivity({
      userId: req.user?.id,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: newProduct.id,
      details: `Ürün oluşturuldu: ${newProduct.name}`,
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

    await logActivity({
      userId: req.user?.id,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: updated.id,
      details: `Ürün güncellendi: ${updated.name}`,
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

    await logActivity({
      userId: req.user?.id,
      action: "PRODUCT_DELETE",
      entity: "Product",
      entityId: deleted.id,
      details: `Ürün silindi: ${deleted.name}`,
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

