const categories = [
  'Fruits & Vegetables',
  'Dairy & Bakery',
  'Snacks & Beverages',
  'Household Items',
  'Staples',
  'Personal Care'
];

export default function Categories() {
  return (
    <section id="categories" className="px-4 py-12 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Shop by Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <div key={cat} className="p-4 border border-gray-700 rounded-lg text-center shadow-sm hover:shadow-md transition bg-gray-800">
            <p>{cat}</p>
          </div>
        ))}
      </div>
    </section>
  );
}