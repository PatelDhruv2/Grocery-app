"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Image as ImageIcon, Plus, ShoppingBasket } from "lucide-react";
import { apiUrl, assetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

function ProductCard({ product, onAdd, added }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = assetUrl(product.imageUrl);

  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-image-link" aria-label={`View ${product.name}`}><div className="product-image-wrap">
        {image && !imageFailed ? (
          <img className="product-image" src={image} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <div className="image-placeholder"><ImageIcon size={28} strokeWidth={1.4} /><span>Image coming soon</span></div>
        )}
        {product.stock > 0 && <span className="stock-tag">In stock</span>}
      </div></Link>
      <div className="product-info">
        <div className="product-category">{(product.category || "FRESH PICK").replaceAll("_", " ")}</div>
        <h3 title={product.name}><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
        <p className="product-description">{product.description || "A good choice for your everyday basket."}</p>
        <div className="product-bottom">
          <strong>{formatPrice(product.price)}</strong>
          <button type="button" className={`add-button${added ? " is-added" : ""}`} onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>
            {added ? <Check size={17} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Deals({ search = "", category = "", onClearCategory = () => {} }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [addedIds, setAddedIds] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchProducts() {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthenticated(false);
        setProducts([]);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      setError("");
      setLoading(true);
      try {
        const response = await fetch(apiUrl("/products/productimage"));
        if (!response.ok) throw new Error("We couldn't load the products just now.");
        const data = await response.json();
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message || "We couldn't load the products just now.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchProducts();
    const onAuthUpdated = () => fetchProducts();
    window.addEventListener("auth-updated", onAuthUpdated);
    return () => { active = false; window.removeEventListener("auth-updated", onAuthUpdated); };
  }, []);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products.filter((product) => product.name?.trim().toLocaleLowerCase() !== "jj").filter((product) => {
      const matchesQuery = !query || `${product.name} ${product.description || ""} ${product.category || ""}`.toLocaleLowerCase().includes(query);
      return matchesQuery && (!category || product.category === category);
    });
  }, [products, search, category]);

  const handleAddToCart = async (product) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setFeedback("Sign in to add items to your cart.");
      return;
    }
    try {
      const response = await fetch(apiUrl("/products/addtocart"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Couldn't add that item. Please try again.");
      window.dispatchEvent(new Event("cart-updated"));
      setAddedIds((current) => current.includes(product.id) ? current : [...current, product.id]);
      setFeedback(`${product.name} added to your cart.`);
      window.setTimeout(() => setAddedIds((current) => current.filter((id) => id !== product.id)), 1800);
    } catch (err) {
      setFeedback(err.message || "Couldn't add that item. Please try again.");
    }
  };

  return (
    <section id="products" className="products-section">
      <div className="section-shell">
        <div className="section-heading products-heading">
          <div><div className="eyebrow">GOOD THINGS, RIGHT NOW</div><h2>{search.trim() || category ? "Shop your picks" : "Fresh from our shelves"}</h2></div>
          {authenticated && <Link className="text-link" href="#categories">Browse categories <ArrowRight size={16} /></Link>}
        </div>
        {!authenticated ? <div className="catalog-signin"><div className="eyebrow">YOUR EVERYDAY SHOP, ALL IN ONE PLACE</div><h3>Sign in to browse the shelves</h3><p>Sign in to see the full grocery selection, check prices and add your favourites to cart.</p><Link className="primary-button" href={`/Login?next=${encodeURIComponent("/#products")}`}>Sign in to shop</Link><span>New to My Basket? <Link href="/Signup">Create an account</Link></span></div> : <>
        {category && <button className="catalog-clear-filter" type="button" onClick={onClearCategory}>Clear category filter</button>}
        {feedback && <p className="store-feedback" role="status">{feedback} {feedback.startsWith("Sign in") && <Link href="/Login">Sign in</Link>}</p>}
        {loading ? (
          <div className="product-grid">{Array.from({ length: 4 }, (_, index) => <div className="product-skeleton" key={index} />)}</div>
        ) : error ? (
          <div className="catalog-message"><ShoppingBasket size={26} /><p>{error}</p><small>Please check back in a moment.</small></div>
        ) : visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={handleAddToCart} added={addedIds.includes(product.id)} />)}
          </div>
        ) : (
          <div className="catalog-message"><ShoppingBasket size={26} /><p>{search.trim() ? `No groceries found for “${search.trim()}”.` : "We’re stocking the shelves."}</p><small>{search.trim() ? "Try another search." : "Our fresh picks will be here soon."}</small></div>
        )}
        </>}
      </div>
    </section>
  );
}
