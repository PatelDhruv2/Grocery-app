import express from "express";
import cors from "cors";
import multer from "multer";
import promClient from "prom-client";
import fs from "fs";
import path from "path";

import prisma from "./config/db.config.js";
import redisClient from "./config/redis.config.js";
import Authroutes from "./routes/Authroutes.js";
import statroute from "./routes/statroute.js";
import Productroute from "./routes/Productroute.js";

const app = express();
app.set("trust proxy", 1);

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const uploadPath = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(uploadPath));

app.use("/api", Authroutes);
app.use("/stats", statroute);
app.use("/products", Productroute);

app.post("/upload-product", upload.single("productFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { name, price, description, category, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required." });
    }

    const createdProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description: description || null,
        category: category || undefined,
        stock: parseInt(stock, 10) || 0,
      },
    });

    const image = await prisma.productImage.create({
      data: {
        productId: createdProduct.id,
        filename: req.file.filename,
        filepath: `/uploads/${req.file.filename}`,
      },
    });

    await redisClient.del("all_products");
    await redisClient.del("products_with_images");
    await redisClient.del("total_products");

    res.status(201).json({
      message: "Product uploaded and saved successfully",
      product: createdProduct,
      image,
      fileUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      productId: createdProduct.id,
    });
  } catch (error) {
    console.error("Error uploading product:", error);
    res.status(500).json({ message: "Server error, failed to upload product." });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/", (_req, res) => {
  res.send("Welcome to the API");
});

export default app;
