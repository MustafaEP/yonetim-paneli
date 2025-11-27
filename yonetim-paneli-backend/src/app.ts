import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);

// Basit health check
app.get("/", (_req, res) => {
  res.json({ message: "Yönetim Paneli API çalışıyor 🚀" });
});

export default app;
