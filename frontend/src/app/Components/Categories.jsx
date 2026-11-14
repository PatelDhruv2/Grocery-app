import { Apple, Baby, Croissant, CupSoda, CookingPot, Fish, Flower2, Leaf, PawPrint, Shirt } from "lucide-react";

const categories = [
  { name: "Fruit & veg", key: "FRUITS_VEGETABLES", note: "Fresh picks for every meal", icon: Apple, tone: "peach" },
  { name: "Dairy & bakery", key: "DAIRY_BAKERY", note: "Daily essentials, freshly stocked", icon: Croissant, tone: "butter" },
  { name: "Pantry staples", key: "STAPLES", note: "The basics, done well", icon: CookingPot, tone: "sage" },
  { name: "Snacks", key: "SNACKS_BRANDED_FOODS", note: "A little something between meals", icon: Leaf, tone: "mint" },
  { name: "Drinks", key: "BEVERAGES", note: "Pour yourself a good one", icon: CupSoda, tone: "blue" },
  { name: "Personal care", key: "PERSONAL_CARE", note: "Everyday care essentials", icon: Flower2, tone: "lilac" },
  { name: "Home essentials", key: "HOUSEHOLD_SUPPLIES", note: "Everyday things for your home", icon: Shirt, tone: "peach" },
  { name: "Home care", key: "CLEANING_HOUSEHOLD", note: "Keep your home feeling fresh", icon: CookingPot, tone: "sage" },
  { name: "Meat & seafood", key: "MEAT_SEAFOOD", note: "Fresh picks for the table", icon: Fish, tone: "blue" },
  { name: "Baby care", key: "BABY_CARE", note: "Gentle everyday essentials", icon: Baby, tone: "lilac" },
  { name: "Pet care", key: "PET_CARE", note: "Good things for your pets", icon: PawPrint, tone: "mint" },
  { name: "Gourmet", key: "GOURMET_WORLD_FOOD", note: "Something special for the table", icon: Croissant, tone: "butter" },
];

export default function Categories({ onSelectCategory = () => {} }) {
  return (
    <section id="categories" className="categories-section section-shell">
      <div className="section-heading">
        <div><div className="eyebrow">A GOOD PLACE TO START</div><h2>Shop the aisles</h2></div>
        <p>All your everyday favourites,<br />in one happy place.</p>
      </div>
      <div className="category-grid">
        {categories.map(({ name, key, note, icon: Icon, tone }) => (
          <a className="category-card" href="#products" key={name} onClick={() => onSelectCategory(key)}>
            <span className={`category-icon ${tone}`}><Icon size={24} strokeWidth={1.7} /></span>
            <span className="category-name">{name}</span>
            <span className="category-note">{note}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
