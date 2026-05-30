import path from 'path';

import redisClient from '../config/redis.config.js';
import prisma from '../config/db.config.js'; 
import publishOrder  from '../../kafka/producers/orderproducer.js'; 
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    if (!name || !price || !req.file) {
      return res.status(400).json({ error: 'Name, price, and photo are required.' });
    }

    // Start a transaction to create product + image
    const createdProduct = await prisma.$transaction(async (tx) => {
      // 1. Create product
      const product = await tx.product.create({
        data: {
          name,
          price: parseFloat(price),
          description,
          category,
        },
      });

      // 2. Create product image linked to product
      const productImage = await tx.productImage.create({
        data: {
          productId: product.id,
          filename: req.file.filename,
          filepath: `/uploads/${req.file.filename}`,  // or req.file.path if absolute
        },
      });

      return { product, productImage };
    });

    // Invalidate product caches after the transaction succeeds
    await redisClient.del('all_products');
    await redisClient.del('products_with_images');
    await redisClient.del('total_products');

    res.status(201).json({
      message: 'Product and image uploaded successfully',
      product: createdProduct.product,
      image: createdProduct.productImage,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error. Failed to upload product.' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const cacheKey = 'all_products';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("Serving from Redis");
      return res.status(200).json(JSON.parse(cached));
    }

    const products = await prisma.product.findMany({});
    await redisClient.set(cacheKey, JSON.stringify(products), { EX: 60 }); // Cache for 60s

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error. Failed to fetch products.' });
  }
}


export const totalProducts = async (req, res) => {
  try {
    const cacheKey = 'total_products';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("Serving total products from Redis");
      return res.status(200).json({ total: parseInt(cached) });
    }

    const total = await prisma.product.count();
    await redisClient.set(cacheKey, total.toString(), { EX: 60 }); // Cache for 1 minute

    res.status(200).json({ total });
  } catch (error) {
    console.error('Error fetching total products:', error);
    res.status(500).json({ error: 'Server error. Failed to fetch total products.' });
  }
};


export const getProductimage = async (req, res) => {
  try {
    const cacheKey = 'products_with_images';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("Serving product images from Redis");
      return res.json(JSON.parse(cached));
    }

    const products = await prisma.product.findMany({
      include: {
        images: true,
      },
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category,
      imageUrl: p.images.length > 0 ? p.images[0].filepath : "",
    }));

    await redisClient.set(cacheKey, JSON.stringify(formattedProducts), { EX: 60 });

    res.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}


export const addToCart = async (req, res) => {
  try {
    const userId = req.userId; 
    console.log("User ID:", userId);
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({ message: "Invalid product ID or quantity" });
    }

    // Step 1: Find or create the user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Step 2: Check if the product is already in the cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      // Step 3a: Update the quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Step 3b: Add new item to the cart
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    await redisClient.del(`cart:${userId}`);

    return res.status(200).json({ message: "Item added to cart successfully",
      
     });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const placeorder = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        const error = new Error("Cart is empty");
        error.statusCode = 400;
        throw error;
      }

      const productIds = cart.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      let totalAmount = 0;
      const orderItems = [];

      for (const item of cart.items) {
        const product = productMap.get(item.productId);

        if (!product || product.stock < item.quantity) {
          const error = new Error(
            `Product ${item.productId} is out of stock or insufficient quantity`
          );
          error.statusCode = 400;
          throw error;
        }

        const stockUpdate = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (stockUpdate.count === 0) {
          const error = new Error(
            `Product ${item.productId} is out of stock or insufficient quantity`
          );
          error.statusCode = 400;
          throw error;
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      return { order, totalAmount };
    });

    await redisClient.del(`cart:${userId}`);

    await publishOrder({
      orderId: result.order.id,
      userId: result.order.userId,
      totalAmount: result.order.totalAmount,
      items: result.order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
      createdAt: new Date().toISOString(),
      userEmail: req.user.email,
    });

    return res.status(200).json({
      message: "Order placed successfully",
      orderId: result.order.id,
      totalAmount: result.totalAmount,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getCartItems = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `cart:${userId}`;

  try {
    // Step 1: Check Redis cache
    const cachedCart = await redisClient.get(cacheKey);

    if (cachedCart) {
      console.log("🧠 Serving cart from Redis cache");
      return res.status(200).json(JSON.parse(cachedCart));
    }

    // Step 2: Fetch from DB
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItems = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      productName: item.product.name,
      productPrice: item.product.price,
    }));

    // Step 3: Store in Redis (with TTL of 10 minutes)
    await redisClient.set(cacheKey, JSON.stringify(cartItems), {
      EX: 600, // 600 seconds = 10 mins
    });

    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  const cartItemId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1" });
  }

  try {
    // Check if the cart item exists
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Update the quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    const cart = await prisma.cart.findUnique({
      where: { id: updatedItem.cartId },
      select: { userId: true },
    });

    if (cart?.userId) {
      await redisClient.del(`cart:${cart.userId}`);
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



