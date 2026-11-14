'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

const VerifyOtp = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setEmail(sessionStorage.getItem('signupEmail') || '');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || err.error || 'Invalid OTP or Email');
        return;
      }

      const data = await res.json();
      console.log('OTP verified:', data);
      localStorage.setItem('token', data.token); 
      localStorage.setItem('user', JSON.stringify(data.user)); // Save user data if needed
      window.dispatchEvent(new Event('auth-updated'));
      sessionStorage.removeItem('signupEmail');
      // Save token if needed
      router.push(data.user.isAdmin ? '/AdminDashboard' : '/profile');
    } catch (err) {
      console.error('OTP verification failed:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-gray-900 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Verify OTP</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="123456"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
