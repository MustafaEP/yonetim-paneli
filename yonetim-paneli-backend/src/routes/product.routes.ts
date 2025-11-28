import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { validate } from "../middlewares/validate";
import {
  createProductValidation,
  updateProductValidation,
} from "../validation/product.validation";



const router = Router();

// Tüm ürünleri listele (PRODUCT_READ)
router.get(
  "/",
  authMiddleware,
  checkPermission("PRODUCT_READ"),
  getAllProducts
);

// Tek ürün getir (PRODUCT_READ)
router.get(
  "/:id",
  authMiddleware,
  checkPermission("PRODUCT_READ"),
  getProductById
);

// Ürün oluştur (PRODUCT_CREATE)
router.post(
  "/",
  authMiddleware,
  checkPermission("PRODUCT_CREATE"),
  validate(createProductValidation),
  createProduct
);

// Ürün güncelle (PRODUCT_UPDATE)
router.put(
  "/:id",
  authMiddleware,
  checkPermission("PRODUCT_UPDATE"),
  validate(updateProductValidation),
  updateProduct
);

// Ürün sil (PRODUCT_DELETE)
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("PRODUCT_DELETE"),
  deleteProduct
);

export default router;
