"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShoppingBasket } from "lucide-react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { apiUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);
  const router = useRouter();
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.productPrice || 0) * Number(item.quantity || 0), 0), [cartItems]);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.replace(`/Login?next=${encodeURIComponent("/Cart")}`); return; }
      const res = await fetch(apiUrl("/products/cartitems"), { headers: { Authorization: token } });
      if (res.status === 404) { setCartItems([]); return; }
      if (!res.ok) throw new Error("We couldn't load your cart. Please try again.");
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchCartItems(); }, []);

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/products/updatecartitem/${id}`), { method: "PUT", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ quantity }) });
      if (!res.ok) throw new Error("We couldn't update that quantity.");
      setCartItems((items) => items.map((item) => item.id === id ? { ...item, quantity } : item));
    } catch (err) { setError(err.message); }
  };

  const handlePlaceOrder = async () => {
    setOrderStatus("");
    try {
      const res = await fetch(apiUrl("/products/placeorder"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: localStorage.getItem("token") } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "We couldn't place your order.");
      setPlacedOrder(data);
      setCartItems([]);
    } catch (err) { setOrderStatus(err.message); }
  };

  return <div className="storefront"><Header /><main className="section-shell cart-page">
    <Link href="/" className="back-to-store"><ArrowLeft size={15} /> Continue shopping</Link>
    <div className="section-heading"><div><div className="eyebrow">YOUR GROCERIES</div><h2>Your cart</h2></div></div>
    {placedOrder ? <section className="order-confirmation" role="status"><div className="eyebrow">ORDER CONFIRMED</div><h2>Your groceries are on their way.</h2><p>We’ll deliver your order to:</p><address>{placedOrder.shippingAddress}</address><p className="order-reference">Order {placedOrder.orderId}</p><Link className="primary-button" href="/profile">View your orders</Link></section> : loading ? <div className="catalog-message" role="status">Loading your cart…</div> : error ? <div className="catalog-message" role="alert"><p>{error}</p><button className="primary-button" onClick={fetchCartItems}>Try again</button></div> : cartItems.length === 0 ? <div className="catalog-message"><ShoppingBasket size={30}/><p>Your cart is waiting for something good.</p><small>Browse fresh picks and everyday essentials.</small><Link className="primary-button" href="/#products">Continue shopping</Link></div> : <div className="cart-layout">
      <ul className="cart-list">{cartItems.map(({ id, productName, productPrice, quantity }) => <li className="cart-item" key={id}><div className="cart-item-copy"><h3>{productName}</h3><p>{formatPrice(productPrice)} each</p><div className="quantity-control"><button aria-label={`Decrease ${productName} quantity`} onClick={() => updateQuantity(id, quantity - 1)} disabled={quantity <= 1}><Minus size={14}/></button><span>{quantity}</span><button aria-label={`Increase ${productName} quantity`} onClick={() => updateQuantity(id, quantity + 1)}><Plus size={14}/></button></div></div><strong>{formatPrice(Number(productPrice) * quantity)}</strong></li>)}</ul>
      <aside className="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Delivering to</span><span>{(() => { try { return JSON.parse(localStorage.getItem("user") || "{}").address || "Your saved address"; } catch { return "Your saved address"; } })()}</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div><button className="primary-button" onClick={handlePlaceOrder}>Place order</button>{orderStatus && <p role="alert" className="store-feedback">{orderStatus} <Link href="/profile">View profile</Link></p>}</aside>
    </div>}
  </main><Footer /></div>;
}
