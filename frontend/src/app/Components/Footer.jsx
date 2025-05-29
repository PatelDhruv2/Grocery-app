export default function Footer() {
  return (
    <footer className="bg-gray-900 py-8 px-4 mt-12 text-white">
      <div className="text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} BigBasket Clone. All rights reserved.
      </div>
    </footer>
  );
}
