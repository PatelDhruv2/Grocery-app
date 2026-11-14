"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/userRegister"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "We couldn’t create your account. Please check your details.");
        return;
      }
      sessionStorage.setItem("signupEmail", data.user?.email || formData.email.trim());
      router.push("/Verify-otp");
    } catch {
      setError("We couldn’t reach the store. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-side">
        <Link href="/" className="brand auth-brand"><span className="brand-mark"><ShoppingBasket size={21} /></span><span>My Basket</span></Link>
        <div className="auth-message"><span className="eyebrow">A FRESH START</span><h1>Make room<br />for <em>good things.</em></h1><p>Your weekly shop, a little more lovely.</p></div>
        <div className="auth-side-note">Good food for real life.</div>
      </div>
      <section className="auth-panel">
        <Link className="back-to-store" href="/"><ArrowLeft size={15} /> Back to the store</Link>
        <div className="auth-form-wrap signup-form-wrap">
          <div className="eyebrow">WELCOME TO MY BASKET</div>
          <h2>Create an account</h2>
          <p className="auth-intro">A few details and you’re all set.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmit} className="auth-form signup-form">
            <label>Full name<input name="name" value={formData.name} onChange={handleChange} placeholder="Your name" autoComplete="name" required /></label>
            <label>Email address<input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" autoComplete="new-password" required /></label>
            <label>Phone number<input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your phone number" autoComplete="tel" required /></label>
            <label>Delivery address<textarea name="address" value={formData.address} onChange={handleChange} placeholder="Street, city, postcode" autoComplete="street-address" required /></label>
            <button type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
          </form>
          <p className="auth-switch">Already have an account? <Link href="/Login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
