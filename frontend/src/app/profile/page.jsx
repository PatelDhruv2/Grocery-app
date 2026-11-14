"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, MapPin, Package, Phone, UserRound } from "lucide-react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { apiUrl } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/Login?next=${encodeURIComponent("/profile")}`);
      return;
    }
    Promise.all([
      fetch(apiUrl("/api/profile"), { headers: { Authorization: token } }),
      fetch(apiUrl("/products/orders"), { headers: { Authorization: token } }),
    ]).then(async ([profileResponse, ordersResponse]) => {
      const profileData = await profileResponse.json();
      const orderData = await ordersResponse.json();
      if (!profileResponse.ok) throw new Error(profileData.message || "We couldn't load your profile.");
      if (!ordersResponse.ok) throw new Error(orderData.message || "We couldn't load your orders.");
      setProfile(profileData);
      setOrders(Array.isArray(orderData) ? orderData : []);
      localStorage.setItem("user", JSON.stringify(profileData));
      window.dispatchEvent(new Event("auth-updated"));
    }).catch((err) => setError(err.message || "We couldn't load your account."))
      .finally(() => setLoading(false));
  }, [router]);

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-updated"));
    router.push("/");
  };

  return <div className="storefront"><Header/><main className="section-shell profile-page">
    <Link href="/" className="back-to-store"><ArrowLeft size={15}/> Continue shopping</Link>
    <div className="profile-heading"><div><div className="eyebrow">YOUR MY BASKET ACCOUNT</div><h1>My profile</h1><p>Account details, delivery address and order history.</p></div>{profile && <button className="outline-button" onClick={signOut}><LogOut size={16}/> Sign out</button>}</div>
    {loading ? <div className="catalog-message" role="status">Loading your account…</div> : error ? <div className="catalog-message" role="alert"><p>{error}</p><Link className="primary-button" href="/Login?next=%2Fprofile">Sign in</Link></div> : <>
      <section className="profile-card"><h2>Account information</h2><div className="profile-fields"><div><UserRound size={18}/><span><small>Name</small><strong>{profile?.name || "Not provided"}</strong></span></div><div><span className="profile-email-icon">@</span><span><small>Email</small><strong>{profile?.email || "Not provided"}</strong></span></div><div><Phone size={18}/><span><small>Phone</small><strong>{profile?.phone || "Not provided"}</strong></span></div><div><MapPin size={18}/><span><small>Delivery address</small><strong>{profile?.address || "No address saved"}</strong></span></div></div>{!profile?.address && <p className="profile-hint">Add a delivery address to your account before placing an order. Contact support if you need to change your saved details.</p>}</section>
      <section className="profile-orders"><div className="profile-section-heading"><div><div className="eyebrow">YOUR PURCHASES</div><h2>Order history</h2></div><Package size={22}/></div>
        {orders.length === 0 ? <div className="catalog-message"><Package size={27}/><p>No orders yet.</p><small>Your orders will appear here after checkout.</small><Link className="primary-button" href="/#products">Browse groceries</Link></div> : <ul className="order-history-list">{orders.map((order) => <li className="order-history-card" key={order.id}><div className="order-history-top"><div><small>ORDER PLACED</small><strong>{formatDate(order.createdAt)}</strong></div><span className={`order-status status-${String(order.status).toLowerCase()}`}>{order.status}</span></div><div className="order-history-items">{order.items.map((item) => <p key={item.id}>{item.product?.name || "Grocery item"} <span>× {item.quantity}</span></p>)}</div><div className="order-history-bottom"><span>Delivering to: {order.shippingAddress || profile?.address || "Address unavailable"}</span><strong>{formatPrice(order.totalAmount)}</strong></div></li>)}</ul>}
      </section>
    </>}
  </main><Footer/></div>;
}
