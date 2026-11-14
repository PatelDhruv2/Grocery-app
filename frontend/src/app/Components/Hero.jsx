"use client";

import { ArrowDown, ArrowRight, Search, Truck } from "lucide-react";

export default function Hero({ search, onSearch }) {
  return (
    <section className="hero-wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> THE GOOD STUFF, DELIVERED</div>
        <h1>Better groceries.<br /><em>Better every day.</em></h1>
        <p className="hero-description">Your neighbourhood market, thoughtfully stocked and just a few clicks away.</p>
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" }); }}>
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="What are you looking for?"
            aria-label="Search groceries"
          />
          <button type="submit" aria-label="Search products"><ArrowRight size={18} /></button>
        </form>
        <div className="delivery-note"><Truck size={16} /><span>Fresh to your door, without the fuss.</span></div>
      </div>
      <div className="hero-art" aria-label="Fresh vegetables and groceries">
        <div className="hero-photo" />
        <div className="hero-label"><span className="hero-label-icon"><ArrowDown size={16} /></span><span><strong>Picked with care</strong><small>Good things start here</small></span></div>
        <div className="hero-stamp">FRESH<br />FINDS</div>
      </div>
    </section>
  );
}
