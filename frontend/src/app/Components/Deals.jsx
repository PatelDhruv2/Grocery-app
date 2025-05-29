"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("http://localhost:5000/products/productimage");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();

        const productsWithFullImageUrl = data.map((product) => ({
          ...product,
          imageUrl: product.imageUrl
            ? `http://localhost:5000${product.imageUrl}`
            : null,
        }));

        setProducts(productsWithFullImageUrl);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

 const handleAddToCart = async (product) => {
  try {
    const token = localStorage.getItem("token"); 
    console.log(product.id);// Adjust based on your auth setup
    const res = await fetch("http://localhost:5000/products/addtocart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to add item to cart");
    }

    const data = await res.json();
    console.log("Server response:", data);

    // Add product to local state cart as visual feedback (optional)
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev;
      return [...prev, product];
    });

    console.log("Added to cart:", product.name);
  } catch (err) {
    console.error("Error adding to cart:", err.message);
  }
};


  const handleGoToCart = () => {
    router.push("/Cart");
  };

  if (loading)
    return <p className="p-4 text-sm text-gray-500">Loading products...</p>;
  if (error)
    return <p className="p-4 text-sm text-red-500">Error: {error}</p>;
  if (products.length === 0)
    return <p className="p-4 text-sm text-gray-500">No products found.</p>;

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {products.map(({ id, name, description, price, imageUrl }) => (
          <div
            key={id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-center w-full h-72 flex flex-col"
          >
            <div className="h-28 w-full flex items-center justify-center bg-gray-100 rounded mb-2">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-24 object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-800 truncate">{name}</h3>
            {description && (
              <p className="text-xs text-gray-500 truncate">{description}</p>
            )}
            <p className="text-sm font-semibold text-green-600 mt-1">${price}</p>
            <button
              onClick={() => handleAddToCart({ id, name, price })}
              className="mt-auto bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded shadow"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {cartItems.length > 0 && (
        <button
          onClick={handleGoToCart}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-lg z-50"
        >
          Go to Cart ({cartItems.length})
        </button>
      )}
    </div>
  );
}
