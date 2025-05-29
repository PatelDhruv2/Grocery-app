"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const router = useRouter();

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/products/cartitems", {
        method: "GET",
        headers: {
          Authorization: token,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch cart items");

      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const updateQuantity = async (cartItemId, newQuantity) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:5000/products/updatecartitem/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        }
      );

      if (!res.ok) throw new Error("Failed to update quantity");

      // Re-fetch cart items after update
      fetchCartItems();
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/products/placeorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to place order");
      }

      setOrderStatus("Order placed successfully!");

      // Optionally clear cart items locally
      setCartItems([]);

      // Wait 2 seconds then redirect to /Dashboard
      setTimeout(() => {
        router.push("/Dashboard");
      }, 2000);
    } catch (err) {
      setOrderStatus(`Error: ${err.message}`);
    }
  };

  if (loading)
    return <p className="p-4 text-sm text-gray-500">Loading cart items...</p>;
  if (error)
    return <p className="p-4 text-sm text-red-500">Error: {error}</p>;
  if (cartItems.length === 0)
    return <p className="p-4 text-sm text-gray-500">Your cart is empty.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
      <ul className="space-y-4">
        {cartItems.map(({ id, productName, productPrice, quantity }) => (
          <li
            key={id}
            className="border rounded p-3 shadow-sm flex justify-between items-center"
          >
            <div>
              <h3 className="text-md font-medium">{productName}</h3>
              <p className="text-sm text-gray-600">
                Quantity: {quantity} × ${productPrice}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() =>
                    quantity > 1 && updateQuantity(id, quantity - 1)
                  }
                  className="bg-gray-200 px-2 py-1 rounded"
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => updateQuantity(id, quantity + 1)}
                  className="bg-gray-200 px-2 py-1 rounded"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-md font-semibold">
              ${(productPrice * quantity).toFixed(2)}
            </p>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePlaceOrder}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow"
      >
        Place Order
      </button>

      {orderStatus && (
        <p className="mt-4 text-center text-sm font-medium">{orderStatus}</p>
      )}
    </div>
  );
}
