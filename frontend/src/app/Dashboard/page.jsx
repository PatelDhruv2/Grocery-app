import Head from 'next/head';
import Header from '../Components/Header';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import Deals from '../components/Deals';



import Footer from '../components/Footer';

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