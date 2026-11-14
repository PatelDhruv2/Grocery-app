"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Minus, Plus } from "lucide-react";
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";
import { apiUrl, assetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("token")) {
      setLoading(false);
      router.replace(`/Login?next=${encodeURIComponent(`/products/${id}`)}`);
      return () => { active = false; };
    }
    setAuthenticated(true);
    fetch(apiUrl("/products/productimage"))
      .then((response) => { if (!response.ok) throw new Error("We couldn't load this product."); return response.json(); })
      .then((items) => { if (active) setProduct(items.find((item) => String(item.id) === String(id)) || null); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, router]);

  const addToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push(`/Login?next=${encodeURIComponent(`/products/${id}`)}`);
    try {
      const response = await fetch(apiUrl("/products/addtocart"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ productId: product.id, quantity }) });
      if (!response.ok) throw new Error("We couldn't add this item. Please try again.");
      setMessage("Added to your cart.");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) { setMessage(err.message); }
  };

  return <div className="storefront"><Header/><main className="section-shell cart-page"><Link href="/" className="back-to-store"><ArrowLeft size={15}/> Back to shopping</Link>
    {!authenticated ? <div className="catalog-message"><p>Sign in to see product details.</p><Link className="primary-button" href={`/Login?next=${encodeURIComponent(`/products/${id}`)}`}>Sign in to shop</Link></div> : loading ? <div className="catalog-message" role="status">Loading product…</div> : error ? <div className="catalog-message" role="alert"><p>{error}</p></div> : !product ? <div className="catalog-message"><p>We couldn't find that product.</p><Link className="primary-button" href="/#products">Browse groceries</Link></div> : <div className="product-detail">
      <div className="product-detail-image">{product.imageUrl && !imageFailed ? <img src={assetUrl(product.imageUrl)} alt={product.name} onError={() => setImageFailed(true)} /> : <div className="image-placeholder"><ImageIcon size={34}/><span>Image coming soon</span></div>}</div>
      <section className="product-detail-copy"><div className="eyebrow">{(product.category || "GROCERIES").replaceAll("_", " ")}</div><h1>{product.name}</h1><p className="detail-description">{product.description || "A good choice for your everyday shop."}</p><strong className="detail-price">{formatPrice(product.price)}</strong><p className="stock-note">{Number(product.stock) > 0 ? "In stock and ready for your cart" : "Currently out of stock"}</p><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14}/></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(Number(product.stock) || 1, value + 1))} disabled={!product.stock || quantity >= Number(product.stock)}><Plus size={14}/></button></div><button className="primary-button" onClick={addToCart} disabled={!product.stock}>Add to cart</button>{message && <p className="store-feedback" role="status">{message} {message === "Added to your cart." && <Link href="/Cart">View cart</Link>}</p>}</section>
    </div>}
  </main><Footer/></div>;
}
