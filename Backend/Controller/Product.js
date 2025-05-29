import path from 'path';
// const Product = require('../models/Product'); // Uncomment if using ORM

import prisma from '../config/db.config.js'; // Adjust the path to your Prisma client

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId } = req.body;
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

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
          categoryId,  // optional, if you want to link category
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
    const products = await prisma.product.findMany({
    });
    console.log('Products:', products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error. Failed to fetch products.' });
  }
}

export const totalProducts = async (req, res) => {
  try {
    const total = await prisma.product.count();
    res.status(200).json({ total });
  } catch (error) {
    console.error('Error fetching total products:', error);
    res.status(500).json({ error: 'Server error. Failed to fetch total products.' });
  }
}

export const getProductimage = async (req, res) => {
  try {
    // Fetch all products with images included
    const products = await prisma.product.findMany({
      include: {
        images: true, // get all images associated
      },
    });

    // Format the response: include only first image's filepath (or empty string)
    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category,
      imageUrl: p.images.length > 0 ? p.images[0].filepath : "", // or construct full URL if needed
    }));

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

    // Step 1: Get the user's cart and items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Step 2: Loop through cart items to:
    // - check stock
    // - deduct stock
    // - calculate total
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Product ${item.productId} is out of stock or insufficient quantity`,
        });
      }

      // Deduct product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity },
      });

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Step 3: Create the order and related order items
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        items: {
          create: orderItems,
        },
      },
    });

    // Step 4: Delete the cart
    // Step 4: Delete cart items first (to satisfy foreign key constraints)
await prisma.cartItem.deleteMany({
  where: { cartId: cart.id },
});

// Step 5: Now safely delete the cart
await prisma.cart.delete({
  where: { id: cart.id },
});


    return res.status(200).json({
      message: "Order placed successfully",
      orderId: order.id,
      totalAmount,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCartItems = async (req, res) => {
  const userId = req.user.id;
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true, // Include product details
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

    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

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

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

