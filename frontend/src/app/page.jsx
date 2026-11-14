"use client";

import { useState } from "react";
import Header from "./Components/Header";
import Hero from "./Components/Hero";
import Categories from "./Components/Categories";
import Deals from "./Components/Deals";
import Footer from "./Components/Footer";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div className="storefront">
      <Header />
      <main>
        <Hero search={search} onSearch={setSearch} />
        <Categories onSelectCategory={setCategory} />
        <Deals search={search} category={category} onClearCategory={() => setCategory("")} />
      </main>
      <Footer />
    </div>
  );
}
