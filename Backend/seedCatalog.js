import prisma from "./config/db.config.js";
import { catalog } from "./catalog.js";

try {
  const jjProducts = await prisma.product.findMany({
    where: { name: { equals: "jj", mode: "insensitive" } },
    include: { cartItems: true, orderItems: true, images: true },
  });
  for (const product of jjProducts) {
    if (product.cartItems.length) {
      await prisma.cartItem.deleteMany({ where: { productId: product.id } });
    }
    if (product.orderItems.length) {
      await prisma.orderItem.deleteMany({ where: { productId: product.id } });
    }
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    console.log("Removed the jj product");
  }

  for (const item of catalog) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
      include: { images: { take: 1 } },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: item.name,
          category: item.category,
          price: item.price,
          stock: item.stock,
          description: item.description,
          images: { create: { filename: "unsplash-product-image", filepath: item.imageUrl } },
        },
      });
      console.log(`Added ${item.name}`);
      continue;
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: {
        description: item.description,
        category: item.category,
        images: existing.images.length
          ? { update: { where: { id: existing.images[0].id }, data: { filename: "unsplash-product-image", filepath: item.imageUrl } } }
          : { create: { filename: "unsplash-product-image", filepath: item.imageUrl } },
      },
    });
    console.log(`Updated presentation for ${item.name}`);
  }
  await prisma.$disconnect();
} catch (error) {
  console.error("Catalog seed failed:", error.message);
  await prisma.$disconnect();
  process.exitCode = 1;
}
