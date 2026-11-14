import Link from "next/link";
import { ArrowUpRight, ShoppingBasket } from "lucide-react";

export default function Footer() {
  return (
    <footer id="about" className="site-footer">
      <div className="section-shell footer-main">
        <div>
          <Link href="/" className="brand footer-brand"><span className="brand-mark"><ShoppingBasket size={21} /></span><span>My Basket</span></Link>
          <p>Everyday groceries, made a little more thoughtful.</p>
        </div>
        <div className="footer-links"><a href="#categories">Browse categories</a><Link href="/Cart">Your cart</Link><Link href="/Signup">Your account</Link><a href="mailto:hello@mybasket.com">Get in touch <ArrowUpRight size={14} /></a></div>
      </div>
      <div className="section-shell footer-bottom"><span>© {new Date().getFullYear()} My Basket</span><span>Good food for real life.</span></div>
    </footer>
  );
}
