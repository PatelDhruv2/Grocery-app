import express from "express";
import cors from "cors";
import multer from "multer";
import promClient from "prom-client";
import fs from "fs";
import path from "path";
import prisma from "./config/db.config.js"; // Adjust the path to your Prisma client
// import your routes
import Authroutes from "./routes/Authroutes.js"; // assumed valid
import statroute from "./routes/statroute.js"; // assumed valid
import Productroute from "./routes/Productroute.js"; // assumed valid
// Setup Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const app = express();
const PORT = process.env.PORT || 5000;

const uploadPath = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);  
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/uploads', express.static(uploadPath));


app.use("/api", Authroutes);
app.use('/stats',statroute);
app.use('/products',Productroute)
app.post('/upload-product', upload.single("productFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { name, price, description,category,stock } = req.body;
    console.log(req.body.category);
     console.log("Request body:", req.body);
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required." });
    }

    
    const createdProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description: description || null, 
        category:category, 
        stock: parseInt(stock) || 0, // Ensure stock is an integer
      },
    });
    const image = await prisma.productImage.create({
      data: {
        productId: createdProduct.id,
        filename: req.file.filename,
        filepath: `/uploads/${req.file.filename}`,
      },
    });

    res.status(201).json({
      message: "Product uploaded and saved successfully",
      product: createdProduct,
      image,
      fileUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`,
      productId: createdProduct.id,
    });
  } catch (error) {
    console.error("Error uploading product:", error);
    res.status(500).json({ message: "Server error, failed to upload product." });
  }
});



// Metrics route
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Root test route
app.get('/', (req, res) => {
  res.send("Welcome to the API");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
