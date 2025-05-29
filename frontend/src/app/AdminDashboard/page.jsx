"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const data = [
  { name: "Jan", sales: 5000 },
  { name: "Feb", sales: 8000 },
  { name: "Mar", sales: 15000 },
  { name: "Apr", sales: 22000 },
  { name: "May", sales: 18000 },
  { name: "Jun", sales: 20000 },
  { name: "Jul", sales: 14000 },
];

const topProducts = [
  { name: "Banana", count: 2200 },
  { name: "Apple", count: 1800 },
  { name: "Broccoli", count: 1400 },
  { name: "Bell Pepper", count: 1100 },
];

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [totalUsers, setTotalUsers] = useState("...");
  const [totalProducts, setTotalProducts] = useState("...");
  const [totalOrders, setTotalOrders] = useState("...");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setToken(token);

    if (token) {
      // Fetch total users
      fetch("http://localhost:5000/stats/totalusers", {
        method: "GET",
        headers: {
          Authorization: token,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error("Failed to fetch total users:", errorText);
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.total !== undefined) {
            console.log("✅ Total users fetched:", data.total);
            setTotalUsers(data.total);
          }
        })
        .catch((err) => console.error("Users fetch error:", err));

      // Fetch total products
      fetch("http://localhost:5000/stats/totalproducts", {
        method: "GET",
        headers: {
          Authorization: token,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error("Failed to fetch total products:", errorText);
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.total !== undefined) {
            console.log("✅ Total products fetched:", data.total);
            setTotalProducts(data.total);
          }
        })
        .catch((err) => console.error("Products fetch error:", err));

      // Fetch total orders
      fetch("http://localhost:5000/stats/totalorders", {
        method: "GET",
        headers: {
          Authorization: token,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error("Failed to fetch total orders:", errorText);
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.total !== undefined) {
            console.log("✅ Total orders fetched:", data.total);
            setTotalOrders(data.total);
          }
        })
        .catch((err) => console.error("Orders fetch error:", err));
    } else {
      console.warn("No token found in localStorage.");
    }
  }, []);

  return (
    <div className="bg-[#0d0d0d] text-white min-h-screen p-6 space-y-6 font-sans">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => router.push("/Upload")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            + Add Product
          </button>
        </div>
        <div className="flex space-x-1 text-lg font-bold">
          <span className="text-green-500">big</span>
          <span>basket</span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-md p-4 flex items-center justify-between">
          <div className="text-green-500 font-bold text-xl">$</div>
          <div className="ml-4">
            <p className="text-sm">Sales</p>
            <p className="text-xl font-bold">$18,735</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-md p-4 flex items-center justify-between">
          <div className="text-green-500 font-bold text-xl">🛒</div>
          <div className="ml-4">
            <p className="text-sm">Orders</p>
            <p className="text-xl font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-md p-4 flex items-center justify-between">
          <div className="text-green-500 font-bold text-xl">👥</div>
          <div className="ml-4">
            <p className="text-sm">Customers</p>
            <p className="text-xl font-bold">{totalUsers}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-md p-4 flex items-center justify-between">
          <div className="text-green-500 font-bold text-xl">📦</div>
          <div className="ml-4">
            <p className="text-sm">Products</p>
            <p className="text-xl font-bold">{totalProducts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Sales Overview</h2>
            <span className="text-green-500 font-bold">$56,420</span>
          </div>
          <div
            style={{
              height: 200,
              background:
                "linear-gradient(to right, #22c55e 10%, transparent 10%, transparent 20%, #22c55e 20%, #22c55e 30%, transparent 30%, transparent 40%, #22c55e 40%, #22c55e 60%, transparent 60%, transparent 70%, #22c55e 70%, #22c55e 90%, transparent 90%)",
              borderRadius: 4,
            }}
          />
        </div>

        <div className="bg-[#1a1a1a] rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Top Products</h2>
          <ul className="space-y-2">
            {topProducts.map(({ name, count }) => (
              <li key={name} className="flex justify-between">
                {name} <span>{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
