import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

// Basit health check
app.get("/", (_req, res) => {
  res.json({ message: "Yönetim Paneli API çalışıyor 🚀" });
});

export default app;
