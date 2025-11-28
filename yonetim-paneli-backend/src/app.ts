import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import activityRoutes from "./routes/activity.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/activity", activityRoutes);

// 404 yakalama
app.use((req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// Basit health check
app.get("/", (_req, res) => {
  res.json({ message: "Yönetim Paneli API çalışıyor 🚀" });
});

// Global error handler
app.use(errorHandler);

export default app;
