import "./globals.css";

export const metadata = {
  title: "My Basket | Everyday groceries, made easy",
  description: "Shop fresh produce, pantry essentials and everyday favourites with My Basket.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
