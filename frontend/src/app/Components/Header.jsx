"use client"
import { ShoppingCart, User } from 'lucide-react';

export default function Header({ isLoggedIn, onLoginClick }) {
  return (
    <header className="flex items-center justify-between p-4 shadow-md bg-gray-900 text-white sticky top-0 z-50">
      <div className="text-2xl font-bold text-green-400">BigBasket Clone</div>
      <nav className="hidden md:flex gap-6 text-sm text-gray-300">
        <a href="#" className="hover:text-white">Home</a>
        <a href="#categories" className="hover:text-white">Categories</a>
        <a href="#deals" className="hover:text-white">Offers</a>
        <a href="#contact" className="hover:text-white">Contact</a>
      </nav>
      <div className="flex items-center gap-4">
        <ShoppingCart className="w-6 h-6" />
       
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
        
       
      </div>
    </header>
  );
}
