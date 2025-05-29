export default function Hero() {
  return (
    <section className="bg-gray-800 py-20 px-4 text-center text-white">
      <h1 className="text-4xl font-bold mb-4">Fresh Groceries Delivered To Your Doorstep</h1>
      <p className="text-gray-300 mb-6">Save time and money. Order groceries online today.</p>
      <input
        type="text"
        placeholder="Search for products..."
        className="px-4 py-2 w-full max-w-md rounded shadow-sm border border-gray-600 bg-gray-900 text-white placeholder-gray-400"
      />
      <div className="mt-6">
        <button className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold">Start Shopping</button>
      </div>
    </section>
  );
}