"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function Header() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const loadCart = async () => {
      const token = localStorage.getItem("token");
      let savedUser = null;
      try { savedUser = JSON.parse(localStorage.getItem("user") || "null"); } catch { savedUser = null; }
      setUser(token ? savedUser : null);
      if (!token) return setCount(0);
      try {
        const response = await fetch(apiUrl("/products/cartitems"), { headers: { Authorization: token } });
        if (!response.ok) return;
        const items = await response.json();
        setCount(Array.isArray(items) ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0);
      } catch { /* Keep the header usable while the API is unavailable. */ }
    };
    loadCart();
    window.addEventListener("focus", loadCart);
    window.addEventListener("cart-updated", loadCart);
    window.addEventListener("auth-updated", loadCart);
    return () => { window.removeEventListener("focus", loadCart); window.removeEventListener("cart-updated", loadCart); window.removeEventListener("auth-updated", loadCart); };
  }, []);
  return (
    <>
      <div className="announcement">
        <span>Good food, right on time.</span>
        <span className="announcement-detail">Fresh picks delivered to your door</span>
      </div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="My Basket home">
          <span className="brand-mark"><ShoppingBasket size={22} strokeWidth={2.2} /></span>
          <span>My Basket</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#categories">Shop categories</a>
          <a href="#products">Fresh picks</a>
          <a href="#about">Our promise</a>
        </nav>
        <div className="header-actions">
          <Link href="/Cart" className="cart-link" aria-label={`Cart${count ? `, ${count} items` : ""}`}><ShoppingBasket size={18} /><span>Cart{count > 0 ? ` (${count})` : ""}</span></Link>
          {user ? <Link href="/profile" className="account-link profile-avatar" aria-label={`Your profile${user.name ? `, ${user.name}` : ""}`} title={user.name || "Your profile"}>{(user.name || user.email || "U").trim().charAt(0).toUpperCase()}</Link> : <Link href="/Login" className="account-link">Sign in <ArrowRight size={15} /></Link>}
        </div>
      </header>
    </>
  );
}
