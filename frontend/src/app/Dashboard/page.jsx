import Head from 'next/head';
import Header from '../Components/Header';
import Hero from '../Components/Hero';
import Categories from '../Components/Categories';
import Deals from '../Components/Deals';



import Footer from '../Components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>BigBasket Clone | Online Grocery Store</title>
        <meta name="description" content="Get fresh groceries delivered at your doorstep. Explore daily deals and shop easily." />
      </Head>
      <Header />
      <main>
        <Hero />
        <Categories />
        <Deals />
        
     
      </main>
      <Footer />
    </>
  );
}
