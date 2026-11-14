"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBasket } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function Login({ initialStep = 0 }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotStep, setForgotStep] = useState(initialStep);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("forgot") === "true") {
        setForgotStep(1);
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/userLogin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Those details didn't match. Please try again.");
        return;
      }
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-updated"));
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(data.user?.isAdmin ? "/AdminDashboard" : (next?.startsWith("/") ? next : "/"));
    } catch {
      setError("We couldn't reach the store. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestResetCode = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "We couldn't send an OTP.");
      setForgotStep(2);
      setNotice(data.message || "A 6-digit OTP has been sent to your email.");
    } catch (err) {
      setError(err.message || "We couldn't send an OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "We couldn't reset your password.");
      setForgotStep(0);
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed successfully! Please sign in with your new password.");
      router.push("/Login");
    } catch (err) {
      setError(err.message || "We couldn't reset your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const returnToSignIn = () => {
    setForgotStep(0);
    setError("");
    setNotice("");
    router.push("/Login");
  };

  return (
    <main className="auth-page">
      <div className="auth-side">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark"><ShoppingBasket size={21} /></span>
          <span>My Basket</span>
        </Link>
        <div className="auth-message">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Good to see<br /><em>you again.</em></h1>
          <p>Your everyday favourites are waiting.</p>
        </div>
        <div className="auth-side-note">Good food for real life.</div>
      </div>
      <section className="auth-panel">
        <Link className="back-to-store" href="/"><ArrowLeft size={15} /> Back to the store</Link>
        <div className="auth-form-wrap">
          <div className="eyebrow">YOUR CART IS JUST AROUND THE CORNER</div>
          <h2>{forgotStep ? "Reset your password" : "Sign in"}</h2>
          <p className="auth-intro">
            {forgotStep === 1
              ? "Enter your account email and we'll send you an OTP."
              : forgotStep === 2
              ? "Enter the 6-digit OTP sent to your email and choose your new password."
              : "Use your email and password to continue."}
          </p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-success" role="status">{notice}</p>}

          {forgotStep === 0 ? (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>
              <p className="auth-switch">
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={() => {
                    setForgotStep(1);
                    setError("");
                    setNotice("");
                  }}
                >
                  Forgot password?
                </button>
              </p>
              <p className="auth-switch">
                New to My Basket? <Link href="/Signup">Create an account</Link>
              </p>
            </>
          ) : forgotStep === 1 ? (
            <>
              <form onSubmit={requestResetCode} className="auth-form">
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
              <p className="auth-switch">
                <button type="button" className="auth-text-button" onClick={returnToSignIn}>
                  Back to sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={submitPasswordReset} className="auth-form">
                <label>
                  Email address
                  <input type="email" value={email} readOnly />
                </label>
                <label>
                  Six-digit OTP
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </label>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Changing password…" : "Change password"}
                </button>
              </form>
              <p className="auth-switch">
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={() => {
                    setForgotStep(1);
                    setError("");
                    setNotice("");
                    setOtp("");
                  }}
                >
                  Resend OTP
                </button>
              </p>
              <p className="auth-switch">
                <button type="button" className="auth-text-button" onClick={returnToSignIn}>
                  Back to sign in
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
