/**
 * Smaakenzzoo - Menu Copy & Description Migration Script
 * 
 * Usage:
 *   node scripts/migrate-copy.js --dry-run   (Prints the diff without writing)
 *   node scripts/migrate-copy.js --write     (Updates local src/data/menu.js file)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const menuFilePath = path.resolve(__dirname, '../src/data/menu.js');

const isWriteMode = process.argv.includes('--write');
const isDryRun = !isWriteMode || process.argv.includes('--dry-run');

console.log('----------------------------------------------------');
console.log(`Running Smaakenzzoo Menu Copy Migration (${isDryRun ? 'DRY-RUN' : 'WRITE MODE'})`);
console.log('----------------------------------------------------\n');

// Forbidden words check
const FORBIDDEN_WORDS = [
  'muscle', 'glycogen', 'training', 'workout', 
  'micro-dosed', 'energy balance', 'high-density', 'supports health'
];

export const updatedMenuItems = [
  // ========================
  // CHURROS
  // ========================
  { 
    id: 1, 
    category: "Churros", 
    name: "Classic Spanish Churros", 
    price: "229.00", 
    description: "Golden, crisp churros rolled in cinnamon sugar with warm chocolate dip.", 
    image: "/classic-spanish-churros.jpg" 
  },
  { 
    id: 2, 
    category: "Churros", 
    name: "Nutty Butty Churros", 
    price: "289.00", 
    description: "Crispy churros coated with crushed roasted almonds, walnuts, and chocolate.", 
    image: "/nutty-butty-churros.jpg" 
  },
  { 
    id: 3, 
    category: "Churros", 
    name: "Churros Shots", 
    price: "259.00", 
    description: "Warm bite-sized churros served in a cup with rich chocolate and caramel.", 
    image: "/churros-shots.jpg" 
  },
  { 
    id: 4, 
    category: "Churros", 
    name: "Churros Pop", 
    price: "249.00", 
    description: "Skewered crisp churros drizzled generously with melted Belgian chocolate.", 
    image: "/churros-pop.jpg" 
  },
  { 
    id: 5, 
    category: "Churros", 
    name: "Three Layered Churros", 
    price: "299.00", 
    description: "Three layers of crisp churros stacked with decadent chocolate and toppings.", 
    image: "/three-layered-churros.jpg" 
  },

  // ========================
  // BELGIAN WAFFLES
  // ========================
  { 
    id: 9, 
    category: "Belgian Waffles", 
    name: "Choco Drizzle Bliss Waffle", 
    price: "139.00", 
    description: "Warm, fluffy Belgian waffle laced with rich milk and dark chocolate drizzle.", 
    image: "/waffle-choco-drizzle-bliss.dim_400x300.jpg" 
  },
  { 
    id: 10, 
    category: "Belgian Waffles", 
    name: "Kitkat Crackle Waffle", 
    price: "169.00", 
    description: "Crisp golden waffle loaded with crushed KitKat wafers and chocolate sauce.", 
    image: "/waffle-kitkat-crackle.dim_400x300.jpg" 
  },
  { 
    id: 11, 
    category: "Belgian Waffles", 
    name: "Royal Rocher Waffle", 
    price: "199.00", 
    description: "Indulgent waffle crowned with crushed Ferrero Rocher and hazelnut chocolate.", 
    image: "/waffle-royal-rocher.dim_400x300.jpg" 
  },
  { 
    id: 115, 
    category: "Belgian Waffles", 
    name: "Berry Nutella Crush Waffle", 
    price: "189.00", 
    description: "Warm waffle topped with luscious berry compote and velvety Nutella spread.", 
    image: "/waffle-berry-nutella-crush.dim_400x300.jpg" 
  },
  { 
    id: 116, 
    category: "Belgian Waffles", 
    name: "Royal Dry Fruit Waffle", 
    price: "199.00", 
    description: "Golden waffle loaded with roasted cashews, almonds, and warm maple glaze.", 
    image: "/waffle-royal-dry-fruit.dim_400x300.jpg" 
  },

  // ========================
  // BUBBLE WAFFLES
  // ========================
  { 
    id: 16, 
    category: "Bubble Waffles", 
    name: "Dark Matter Bubble Waffle", 
    price: "309.00", 
    description: "Fluffy egg bubble waffle wrapped around rich dark chocolate and whipped cream.", 
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80" 
  },
  { 
    id: 17, 
    category: "Bubble Waffles", 
    name: "Cookie Overload Bubble Waffle", 
    price: "319.00", 
    description: "Warm bubble waffle packed with crushed Oreos, chocolate drizzle, and cream.", 
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80" 
  },
  { 
    id: 18, 
    category: "Bubble Waffles", 
    name: "Royal Rocher Bubble Waffles", 
    price: "339.00", 
    description: "Crisp bubble waffle filled with hazelnut cream, Ferrero Rocher, and fudge.", 
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80" 
  },
  { 
    id: 19, 
    category: "Bubble Waffles", 
    name: "Fruit Heaven Bubble Waffle", 
    price: "329.00", 
    description: "Freshly baked bubble waffle layered with seasonal fruit slices and honey.", 
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80" 
  },

  // ========================
  // ICE CREAM SUNDAES
  // ========================
  { 
    id: 20, 
    category: "Icecream Sundaes", 
    name: "Kitkat Meltdown Sundae", 
    price: "229.00", 
    description: "Creamy vanilla ice cream layered with crunchy KitKat chunks and fudge sauce.", 
    image: "/sundae-kitkat.dim_400x300.jpg" 
  },
  { 
    id: 21, 
    category: "Icecream Sundaes", 
    name: "Oreo Dream Cloud Sundae", 
    price: "219.00", 
    description: "Silky ice cream topped with Oreo crumble, chocolate chips, and warm fudge.", 
    image: "/sundae-oreo.dim_400x300.jpg" 
  },
  { 
    id: 22, 
    category: "Icecream Sundaes", 
    name: "Pink Crush Sundae", 
    price: "209.00", 
    description: "Delightful strawberry ice cream topped with berry coulis and sprinkles.", 
    image: "/sundae-pink-crush.dim_400x300.jpg" 
  },
  { 
    id: 23, 
    category: "Icecream Sundaes", 
    name: "Nutstorm Delight Sundae", 
    price: "249.00", 
    description: "Scoops of rich vanilla loaded with toasted nuts and golden caramel syrup.", 
    image: "/sundae-nutstorm.dim_400x300.jpg" 
  },
  { 
    id: 24, 
    category: "Icecream Sundaes", 
    name: "Ferrero Royale", 
    price: "259.00", 
    description: "Velvety chocolate gelato crowned with whole Ferrero Rocher and hazelnut fudge.", 
    image: "/sundae-ferrero.dim_400x300.jpg" 
  },
  { 
    id: 25, 
    category: "Icecream Sundaes", 
    name: "Smaakenzzoo Banana Bliss", 
    price: "289.00", 
    description: "Fresh sliced bananas over creamy ice cream with warm caramel and nuts.", 
    image: "/sundae-banana.dim_400x300.jpg" 
  },
  { 
    id: 26, 
    category: "Icecream Sundaes", 
    name: "Nutella Fudge Fantasy", 
    price: "249.00", 
    description: "Decadent scoops of chocolate ice cream swirled with thick Nutella and fudge.", 
    image: "/sundae-nutella-fudge.dim_400x300.jpg" 
  },
  { 
    id: 27, 
    category: "Icecream Sundaes", 
    name: "Death By Chocolate", 
    price: "269.00", 
    description: "Layers of dense chocolate cake, dark fudge, chocolate ice cream, and nuts.", 
    image: "/sundae-death-by-choc.dim_400x300.jpg" 
  },

  // ========================
  // MINI PANCAKES
  // ========================
  { 
    id: 28, 
    category: "Mini Pancakes", 
    name: "American Maple Pancake", 
    price: "209.00", 
    description: "Warm fluffy mini pancakes drizzled with pure golden maple syrup and butter.", 
    image: "/pancake-maple.dim_400x300.jpg" 
  },
  { 
    id: 29, 
    category: "Mini Pancakes", 
    name: "Nutella Oreo Pancake", 
    price: "229.00", 
    description: "Bite-sized pancakes smothered in rich Nutella spread and crunchy Oreo dust.", 
    image: "/pancake-nutella-oreo.dim_400x300.jpg" 
  },
  { 
    id: 30, 
    category: "Mini Pancakes", 
    name: "Kitkat White Chocolate Pancake", 
    price: "239.00", 
    description: "Fluffy mini pancakes drizzled with silky white chocolate and crushed KitKat.", 
    image: "/pancake-kitkat-white-choc.dim_400x300.jpg" 
  },
  { 
    id: 31, 
    category: "Mini Pancakes", 
    name: "Real Fruit Blast Pancake", 
    price: "249.00", 
    description: "Warm mini pancakes topped with fresh seasonal berries, fruit, and honey.", 
    image: "/pancake-real-fruit.dim_400x300.jpg" 
  },

  // ========================
  // BROWNIE SIZZLERS
  // ========================
  { 
    id: 32, 
    category: "Brownie Sizzlers", 
    name: "Caramel Crunch Sizzler", 
    price: "239.00", 
    description: "Sizzling hot brownie with vanilla ice cream, butterscotch, and crunchy nuts.", 
    image: "/sizzler-caramel-crunch.dim_400x300.jpg" 
  },
  { 
    id: 33, 
    category: "Brownie Sizzlers", 
    name: "Nutella Lava Sizzler", 
    price: "249.00", 
    description: "Gooey chocolate brownie on a sizzler plate drenched in molten Nutella sauce.", 
    image: "/sizzler-nutella-lava.dim_400x300.jpg" 
  },
  { 
    id: 34, 
    category: "Brownie Sizzlers", 
    name: "Cookies 'n' Cream Sizzler", 
    price: "259.00", 
    description: "Hot sizzling brownie paired with vanilla ice cream and crushed Oreo cookies.", 
    image: "/sizzler-cookies-cream.dim_400x300.jpg" 
  },
  { 
    id: 35, 
    category: "Brownie Sizzlers", 
    name: "Royal Dry Fruit Sizzler", 
    price: "279.00", 
    description: "Warm fudge brownie loaded with roasted nuts, sizzling in chocolate syrup.", 
    image: "/sizzler-dry-fruit.dim_400x300.jpg" 
  },
  { 
    id: 36, 
    category: "Brownie Sizzlers", 
    name: "Rocher Melt Sizzler", 
    price: "289.00", 
    description: "Molten chocolate brownie with vanilla scoop and melted Ferrero Rocher.", 
    image: "/sizzler-rocher-melt.dim_400x300.jpg" 
  },

  // ========================
  // MILKSHAKES
  // ========================
  { 
    id: 37, 
    category: "Milkshakes", 
    name: "Blush Vanilla Charm Shake", 
    price: "169.00", 
    description: "Thick creamy shake blended with classic Madagascar vanilla bean.", 
    image: "/shake-vanilla.dim_400x300.jpg" 
  },
  { 
    id: 38, 
    category: "Milkshakes", 
    name: "Alphonso Mango Shake", 
    price: "179.00", 
    description: "Rich, luscious milkshake blended with sun-ripened Alphonso mango pulp.", 
    image: "/shake-mango.dim_400x300.jpg" 
  },
  { 
    id: 39, 
    category: "Milkshakes", 
    name: "Choco Lava Love Shake", 
    price: "189.00", 
    description: "Decadent chocolate shake blended with gooey chocolate fudge.", 
    image: "/shake-choco-lava.dim_400x300.jpg" 
  },
  { 
    id: 40, 
    category: "Milkshakes", 
    name: "Pinkberry Swirl Shake", 
    price: "199.00", 
    description: "Refreshing thick shake infused with natural strawberry and berry swirl.", 
    image: "/shake-pinkberry.dim_400x300.jpg" 
  },
  { 
    id: 41, 
    category: "Milkshakes", 
    name: "Kitkat Krunch Rush Shake", 
    price: "209.00", 
    description: "Creamy chocolate shake loaded with crunchy blended KitKat bits.", 
    image: "/shake-kitkat.dim_400x300.jpg" 
  },
  { 
    id: 42, 
    category: "Milkshakes", 
    name: "Oreo Blast Supreme Shake", 
    price: "229.00", 
    description: "Thick milkshake churned with real Oreo cookies and chocolate drizzle.", 
    image: "/shake-oreo-blast.dim_400x300.jpg" 
  },
  { 
    id: 43, 
    category: "Milkshakes", 
    name: "Nutella Cloud Shake", 
    price: "259.00", 
    description: "Velvety smooth shake blended with genuine hazelnut Nutella spread.", 
    image: "/shake-nutella-cloud.dim_400x300.jpg" 
  },
  { 
    id: 44, 
    category: "Milkshakes", 
    name: "Lotus Biscoff Shake", 
    price: "259.00", 
    description: "Creamy indulgent shake blended with spiced caramel Lotus Biscoff cookies.", 
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80" 
  },
  { 
    id: 45, 
    category: "Milkshakes", 
    name: "Blackcurrant Shake", 
    price: "259.00", 
    description: "Vibrant milkshake blended with sweet and tangy blackcurrant berries.", 
    image: "/shake-black-currant.dim_400x300.jpg" 
  },
  { 
    id: 46, 
    category: "Milkshakes", 
    name: "American Dry Fruit Shake", 
    price: "279.00", 
    description: "Rich royal milkshake loaded with blended almonds, cashews, and dates.", 
    image: "/shake-dry-fruit.dim_400x300.jpg" 
  },

  // ========================
  // COFFEES
  // ========================
  { 
    id: 47, 
    category: "Coffees", 
    name: "Espresso", 
    price: "89.00", 
    description: "Bold, intense shot of pure freshly brewed artisanal coffee.", 
    image: "/coffee-espresso..jpg" 
  },
  { 
    id: 48, 
    category: "Coffees", 
    name: "Americano", 
    price: "109.00", 
    description: "Rich espresso topped with hot water for a smooth, deep coffee finish.", 
    image: "/coffee-americano.jpg" 
  },
  { 
    id: 49, 
    category: "Coffees", 
    name: "Cafe Latte", 
    price: "129.00", 
    description: "Smooth espresso poured over gently steamed milk with a silky microfoam.", 
    image: "/coffee-latte.jpg" 
  },
  { 
    id: 50, 
    category: "Coffees", 
    name: "Cappuccino", 
    price: "159.00", 
    description: "Classic Italian brew with equal parts rich espresso, steamed milk, and froth.", 
    image: "/coffee-cappuccino.jpg" 
  },
  { 
    id: 51, 
    category: "Coffees", 
    name: "Hot Chocolate", 
    price: "169.00", 
    description: "Velvety warm melted chocolate whisked with rich whole milk.", 
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&q=80" 
  },
  { 
    id: 52, 
    category: "Coffees", 
    name: "Iced Americano", 
    price: "129.00", 
    description: "Double espresso shot poured over ice and cold water for a crisp pick-me-up.", 
    image: "/coffee-iced-americano.jpg" 
  },
  { 
    id: 53, 
    category: "Coffees", 
    name: "Iced Mocha", 
    price: "149.00", 
    description: "Chilled espresso and rich dark chocolate blended with milk over ice.", 
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80" 
  },
  { 
    id: 54, 
    category: "Coffees", 
    name: "Iced Latte", 
    price: "149.00", 
    description: "Smooth espresso poured over cold milk and ice cubes.", 
    image: "/coffee-iced-latte.jpg" 
  },
  { 
    id: 55, 
    category: "Coffees", 
    name: "Iced Hazelnut Coffee", 
    price: "179.00", 
    description: "Chilled brewed coffee infused with aromatic toasted hazelnut syrup.", 
    image: "/coffee-iced-hazelnut.jpg" 
  },
  { 
    id: 56, 
    category: "Coffees", 
    name: "Iced Caramel Coffee", 
    price: "179.00", 
    description: "Crisp iced coffee swirled with golden buttery caramel sauce.", 
    image: "/coffee-iced-caramel.jpg" 
  },
  { 
    id: 57, 
    category: "Coffees", 
    name: "French Vanilla", 
    price: "179.00", 
    description: "Warm aromatic coffee flavored with delicate French vanilla bean essence.", 
    image: "/coffee-french-vanilla.jpg" 
  },

  // ========================
  // MOCKTAILS
  // ========================
  { 
    id: 58, 
    category: "Mocktails", 
    name: "Mint", 
    price: "99.00", 
    description: "Chilled bubbly soda muddled with fresh garden mint leaves and zesty lime.", 
    image: "/mocktail-mint.dim_400x300.jpg" 
  },
  { 
    id: 59, 
    category: "Mocktails", 
    name: "Ice Tea", 
    price: "99.00", 
    description: "Refreshing brewed iced tea infused with natural lemon and fresh mint.", 
    image: "/mocktail-ice-tea.dim_400x300.jpg" 
  },
  { 
    id: 60, 
    category: "Mocktails", 
    name: "Orange Cooler", 
    price: "99.00", 
    description: "Sparkling citrus cooler with sweet Valencia orange juice and ice.", 
    image: "/mocktail-orange-cooler.dim_400x300.jpg" 
  },
  { 
    id: 61, 
    category: "Mocktails", 
    name: "Mango Cinnamon", 
    price: "99.00", 
    description: "Luscious mango nectar with a gentle hint of warm aromatic cinnamon.", 
    image: "/mocktail-mango-cinnamon.dim_400x300.jpg" 
  },
  { 
    id: 62, 
    category: "Mocktails", 
    name: "Cranberry Chill", 
    price: "99.00", 
    description: "Tart and sweet sparkling cranberry cooler served ice-cold.", 
    image: "/mocktail-cranberry.dim_400x300.jpg" 
  },

  // ========================
  // PIZZA
  // ========================
  { 
    id: 63, 
    category: "Pizza", 
    name: "Veggie Delight", 
    price: "299.00", 
    description: "Stone-baked pizza topped with mozzarella, crisp bell peppers, onions, and corn.", 
    image: "/pizza-veggie-delight.dim_400x300.jpg" 
  },
  { 
    id: 64, 
    category: "Pizza", 
    name: "Paneer Punch", 
    price: "309.00", 
    description: "Crisp crust topped with spiced paneer cubes, capsicum, and melted mozzarella.", 
    image: "/pizza-paneer-punch.dim_400x300.jpg" 
  },
  { 
    id: 65, 
    category: "Pizza", 
    name: "Flamin' Peri Chick'n Blaze", 
    price: "359.00", 
    description: "Spicy peri peri marinated chicken on melted cheese and herb tomato sauce.", 
    image: "/pizza-peri-chicken.dim_400x300.jpg" 
  },
  { 
    id: 66, 
    category: "Pizza", 
    name: "Chick Fiesta Pizza", 
    price: "349.00", 
    description: "Loaded with grilled chicken pieces, juicy sweet corn, and golden cheese.", 
    image: "/pizza-chick-fiesta.dim_400x300.jpg" 
  },
  { 
    id: 67, 
    category: "Pizza", 
    name: "Chicken Tikka Pizza", 
    price: "379.00", 
    description: "Smoky tandoori spiced chicken tikka chunks over melted cheese and herbs.", 
    image: "/pizza-chicken-tikka.dim_400x300.jpg" 
  },
  { 
    id: 73, 
    category: "Pizza", 
    name: "Harissa Chicken Pizza", 
    price: "379.00", 
    description: "North African spiced harissa chicken roasted on a crisp cheesy crust.", 
    image: "/pizza-harissa-chicken.dim_400x300.jpg" 
  },

  // ========================
  // BURGERS
  // ========================
  { 
    id: 74, 
    category: "Burgers", 
    name: "Gobbler Veg", 
    price: "149.00", 
    description: "Crispy spiced vegetable patty layered with fresh lettuce, mayo, and tomato.", 
    image: "/burger-gobbler-veg.jpg" 
  },
  { 
    id: 75, 
    category: "Burgers", 
    name: "Gobbler Chicken", 
    price: "169.00", 
    description: "Juicy golden fried chicken patty nestled in toasted buns with herb mayo.", 
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" 
  },
  { 
    id: 76, 
    category: "Burgers", 
    name: "King Burger Veg", 
    price: "209.00", 
    description: "Double-stacked veggie patties topped with melted cheese slice and house sauce.", 
    image: "/burger-king-veg.jpg" 
  },
  { 
    id: 77, 
    category: "Burgers", 
    name: "King Burger Chicken", 
    price: "229.00", 
    description: "Crispy chicken patty crowned with melted cheddar cheese and tangy burger relish.", 
    image: "/burger-king-chicken.jpg" 
  },
  { 
    id: 78, 
    category: "Burgers", 
    name: "Peri Peri Burger Veg", 
    price: "239.00", 
    description: "Spicy crumb-fried veggie patty dusted with fiery peri peri seasoning.", 
    image: "/burger-peri-peri.jpg" 
  },
  { 
    id: 79, 
    category: "Burgers", 
    name: "Peri Peri Burger Chicken", 
    price: "249.00", 
    description: "Crisp chicken breast tossed in bold peri peri spices with garlic mayo.", 
    image: "/burger-peri-peri-chicken.jpg" 
  },

  // ========================
  // SANDWICHES
  // ========================
  { 
    id: 80, 
    category: "Sandwiches", 
    name: "Harissa Chicken Sandwich", 
    price: "269.00", 
    description: "Toasted bread filled with zesty harissa spiced chicken and crunchy greens.", 
    image: "/sandwich-harissa-chicken.dim_400x300.jpg" 
  },
  { 
    id: 81, 
    category: "Sandwiches", 
    name: "Harissa Paneer Sandwich", 
    price: "229.00", 
    description: "Grilled cottage cheese tossed in smoky harissa sauce inside toasted bread.", 
    image: "/sandwich-harissa-paneer.dim_400x300.jpg" 
  },
  { 
    id: 82, 
    category: "Sandwiches", 
    name: "Chicken Tikka Sandwich", 
    price: "279.00", 
    description: "Tender chicken tikka tossed in spiced mayo and grilled golden brown.", 
    image: "/sandwich-chicken-tikka.dim_400x300.jpg" 
  },
  { 
    id: 83, 
    category: "Sandwiches", 
    name: "Paneer Tikka Sandwich", 
    price: "239.00", 
    description: "Marinated paneer cubes with mint mayo pressed between buttered toast.", 
    image: "/sandwich-paneer-tikka.dim_400x300.jpg" 
  },
  { 
    id: 84, 
    category: "Sandwiches", 
    name: "Chicken Club Sandwich", 
    price: "329.00", 
    options: [
      { title: "Standard Portion", price: "329.00" },
      { title: "Double Loaded", price: "379.00" }
    ],
    description: "Triple-layer toasted sandwich stuffed with seasoned chicken, egg, and cheese.", 
    image: "/sandwich-club-chicken.dim_400x300.jpg" 
  },
  { 
    id: 85, 
    category: "Sandwiches", 
    name: "Veg Club Sandwich", 
    price: "299.00", 
    options: [
      { title: "Standard Portion", price: "299.00" },
      { title: "Extra Cheese & Paneer", price: "349.00" }
    ],
    description: "Three-tier toasted bread loaded with cheese, cucumbers, tomatoes, and mayo.", 
    image: "/sandwich-veg-club.dim_400x300.jpg" 
  },
  { 
    id: 86, 
    category: "Sandwiches", 
    name: "Cold Egg Sandwich", 
    price: "139.00", 
    description: "Soft sandwich bread filled with creamy seasoned egg and herb mayo spread.", 
    image: "/cold-egg-sandwich.jpg" 
  },
  { 
    id: 87, 
    category: "Sandwiches", 
    name: "Chicken Cold Sandwich", 
    price: "189.00", 
    description: "Chilled shredded chicken tossed in creamy mayonnaise between soft slices.", 
    image: "/chicken-cold-sandwich.jpg" 
  },
  { 
    id: 88, 
    category: "Sandwiches", 
    name: "Veg Cold Sandwich", 
    price: "159.00", 
    description: "Soft bread stuffed with crisp seasoned vegetables and chilled green chutney.", 
    image: "/veg-cold-sandwich.jpg" 
  },

  // ========================
  // CHICKEN APPETISER
  // ========================
  { 
    id: 89, 
    category: "Chicken Appetiser", 
    name: "Honey Glazed Chicken Wings", 
    price: "249.00", 
    description: "Crisp fried chicken wings tossed in sweet and sticky honey garlic glaze.", 
    image: "https://images.unsplash.com/photo-1527477378377-f38b251ce7c7?w=500&q=80" 
  },
  { 
    id: 90, 
    category: "Chicken Appetiser", 
    name: "Peri Peri Chicken Wings", 
    price: "229.00", 
    description: "Tender chicken wings dusted with fiery African peri peri dry spice rub.", 
    image: "https://images.unsplash.com/photo-1527477378377-f38b251ce7c7?w=500&q=80" 
  },
  { 
    id: 91, 
    category: "Chicken Appetiser", 
    name: "BBQ Chicken Wings", 
    price: "279.00", 
    description: "Juicy chicken wings coated in smoky, tangy American barbecue sauce.", 
    image: "https://images.unsplash.com/photo-1527477378377-f38b251ce7c7?w=500&q=80" 
  },
  { 
    id: 92, 
    category: "Chicken Appetiser", 
    name: "Chilli Garlic Wings", 
    price: "249.00", 
    description: "Crispy wings wok-tossed with spicy red chilli sauce and minced garlic.", 
    image: "https://images.unsplash.com/photo-1527477378377-f38b251ce7c7?w=500&q=80" 
  },

  // ========================
  // NON VEG SNACKS
  // ========================
  { 
    id: 114, 
    category: "Non Veg Snacks", 
    name: "Chicken Nuggets", 
    price: "239.00", 
    description: "Bite-sized golden crumbed chicken nuggets, tender inside and crisp outside.", 
    image: "/snack-chicken-nuggets.dim_400x300.jpg" 
  },
  { 
    id: 93, 
    category: "Non Veg Snacks", 
    name: "Chicken Garlic Fingers", 
    price: "249.00", 
    description: "Crispy chicken tenders infused with fragrant roasted garlic and herbs.", 
    image: "/snack-chicken-garlic-fingers.dim_400x300.jpg" 
  },
  { 
    id: 94, 
    category: "Non Veg Snacks", 
    name: "Chicken Breast Strips 5pcs", 
    price: "209.00", 
    description: "Succulent chicken breast strips in a crunchy seasoned crumb coating.", 
    image: "/snack-chicken-breast-strips.dim_400x300.jpg" 
  },
  { 
    id: 95, 
    category: "Non Veg Snacks", 
    name: "Spicy Chicken Kievs", 
    price: "209.00", 
    description: "Golden fried chicken bites filled with seasoned herb butter and molten cheese.", 
    image: "/snack-chicken-kievs.dim_400x300.jpg" 
  },

  // ========================
  // VEG SNACKS
  // ========================
  { 
    id: 97, 
    category: "Veg Snacks", 
    name: "Veg Fingers", 
    price: "219.00", 
    description: "Crisp golden fingers filled with spiced mashed potatoes and garden vegetables.", 
    image: "/snack-veg-fingers.dim_400x300.jpg" 
  },
  { 
    id: 117, 
    category: "Veg Snacks", 
    name: "Veggie Nuggets", 
    price: "219.00", 
    description: "Crunchy bite-sized nuggets packed with corn, potatoes, and mild spices.", 
    image: "/snack-veg-nuggets.dim_400x300.jpg" 
  },
  { 
    id: 98, 
    category: "Veg Snacks", 
    name: "Veggie Kievs", 
    price: "209.00", 
    description: "Crispy crumbed veggie rolls filled with molten cheese and savory herbs.", 
    image: "/snack-veg-kievs.dim_400x300.jpg" 
  },

  // ========================
  // FRENCH FRIES
  // ========================
  { 
    id: 100, 
    category: "French Fries", 
    name: "Classic Salted", 
    price: "179.00", 
    description: "Golden, crisp French fries lightly tossed with sea salt. Served hot.", 
    image: "/fries-classic.jpg" 
  },
  { 
    id: 101, 
    category: "French Fries", 
    name: "Og Peri Peri", 
    price: "189.00", 
    description: "Hot crispy fries generously dusted with spicy, tangy peri peri seasoning.", 
    image: "/fries-peri-peri.jpg" 
  },
  { 
    id: 102, 
    category: "French Fries", 
    name: "The Hot Cheese", 
    price: "199.00", 
    description: "Crisp French fries drenched in rich, molten cheddar cheese sauce.", 
    image: "/fries-hot-cheese.jpg" 
  },
  { 
    id: 103, 
    category: "French Fries", 
    name: "Chicken'n Stack", 
    price: "229.00", 
    description: "Golden fries piled high with spiced shredded chicken and creamy cheese sauce.", 
    image: "/fries-chicken-stack.jpg" 
  },

  // ========================
  // ICE CREAMS (Merged: Classic & Premium)
  // ========================
  { 
    id: 105, 
    category: "Ice Creams", 
    name: "Classic Single Scoop", 
    price: "60.00", 
    description: "One generous scoop of rich, creamy traditional churned ice cream.", 
    image: "/icecream-single-scoop.jpg" 
  },
  { 
    id: 106, 
    category: "Ice Creams", 
    name: "Classic Double Scoop", 
    price: "110.00", 
    description: "Two delightful scoops of your favorite classic ice cream flavors.", 
    image: "/icecream-double-scoop.jpg" 
  },
  { 
    id: 107, 
    category: "Ice Creams", 
    name: "Classic Tub - 5 Scoops", 
    price: "280.00", 
    description: "Family sharing tub packed with five generous scoops of creamy ice cream.", 
    image: "/icecream-tub-5-scoops.jpg" 
  },
  { 
    id: 108, 
    category: "Ice Creams", 
    name: "Waffle Cone", 
    price: "20.00", 
    description: "Freshly baked crunchy waffle cone to pair with your favorite scoop.", 
    image: "/icecream-cone..jpg" 
  },
  { 
    id: 110, 
    category: "Ice Creams", 
    name: "Premium Single Scoop", 
    price: "85.00", 
    badge: "Premium",
    description: "One scoop of artisanal handcrafted ice cream made with premium ingredients.", 
    image: "/premium-icecream-single.dim_400x300.jpg" 
  },
  { 
    id: 111, 
    category: "Ice Creams", 
    name: "Premium Double Scoop", 
    price: "160.00", 
    badge: "Premium",
    description: "Two scoops of luxurious premium ice cream with rich gourmet notes.", 
    image: "/premium-icecream-double.dim_400x300.jpg" 
  },
  { 
    id: 109, 
    category: "Ice Creams", 
    name: "Premium Tub - 5 Scoops", 
    price: "360.00", 
    badge: "Premium",
    description: "Indulgent sharing tub packed with five scoops of gourmet artisanal ice cream.", 
    image: "/premium-icecream-tub.dim_400x300.jpg" 
  },

  // ========================
  // BEVERAGES
  // ========================
  { 
    id: 112, 
    category: "Beverages", 
    name: "Water Bottle", 
    price: "10.00", 
    description: "Chilled packaged drinking water.", 
    image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80" 
  },
  { 
    id: 113, 
    category: "Beverages", 
    name: "Coke", 
    price: "25.00", 
    description: "Chilled Coca-Cola, served with ice.", 
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80" 
  }
];

export const addOnOptionGroups = {
  churros: {
    id: 'churros_dips',
    name: 'Dips & Sauces',
    min: 0,
    max: 3,
    options: [
      { id: 'opt_caramel_dip', name: 'Caramel Dip', price: '20.00', inStock: true },
      { id: 'opt_chocolate_dip', name: 'Chocolate Dip', price: '20.00', inStock: true },
      { id: 'opt_nutella_dip', name: 'Nutella Dip', price: '25.00', inStock: true }
    ]
  },
  waffles: {
    id: 'waffle_addons',
    name: 'Scoops & Brownie Base',
    min: 0,
    max: 2,
    options: [
      { id: 'opt_single_scoop', name: 'Single Scoop Ice Cream', price: '60.00', inStock: true },
      { id: 'opt_double_scoop', name: 'Double Scoop Ice Cream', price: '110.00', inStock: true },
      { id: 'opt_half_brownie', name: 'Half Brownie Base', price: '30.00', inStock: true },
      { id: 'opt_full_brownie', name: 'Full Brownie Base', price: '50.00', inStock: true }
    ]
  },
  pizza: {
    id: 'pizza_toppings',
    name: 'Extra Toppings & Dips',
    min: 0,
    max: 5,
    options: [
      { id: 'opt_extra_onion', name: 'Extra Onion', price: '15.00', inStock: true },
      { id: 'opt_extra_veggies', name: 'Extra Veggies', price: '30.00', inStock: true },
      { id: 'opt_extra_cheese', name: 'Extra Cheese', price: '40.00', inStock: true },
      { id: 'opt_extra_chicken', name: 'Extra Chicken', price: '60.00', inStock: true },
      { id: 'opt_pizza_dip', name: 'Extra Dip', price: '15.00', inStock: true }
    ]
  },
  snacks: {
    id: 'snack_dips',
    name: 'Add-on Dips',
    min: 0,
    max: 3,
    options: [
      { id: 'opt_dip_garlic_mayo', name: 'Garlic Mayo Dip', price: '15.00', inStock: true },
      { id: 'opt_dip_peri_peri', name: 'Peri Peri Dip', price: '15.00', inStock: true },
      { id: 'opt_dip_cheese', name: 'Cheese Dip', price: '15.00', inStock: true }
    ]
  }
};

// Validate all descriptions
console.log(`Checking ${updatedMenuItems.length} updated items for constraints:`);
let validationErrors = 0;

updatedMenuItems.forEach(item => {
  if (item.description.length > 100) {
    console.error(`[LENGTH ERROR] Item #${item.id} "${item.name}" exceeds 100 chars: ${item.description.length} chars`);
    validationErrors++;
  }
  FORBIDDEN_WORDS.forEach(word => {
    if (item.description.toLowerCase().includes(word.toLowerCase())) {
      console.error(`[FORBIDDEN WORD] Item #${item.id} "${item.name}" contains "${word}"`);
      validationErrors++;
    }
  });
});

if (validationErrors === 0) {
  console.log('✓ All descriptions pass: length <= 100 characters and zero forbidden words.\n');
} else {
  console.error(`Found ${validationErrors} validation errors!`);
  process.exit(1);
}

// Compare diff with current menu.js
import('../src/data/menu.js').then(({ menuItems: currentItems }) => {
  console.log('DIFF ANALYSIS:');
  console.log(`Current items in menu.js: ${currentItems.length}`);
  console.log(`Updated items after cleanup: ${updatedMenuItems.length}`);
  console.log(`Standalone add-ons moved into option groups: ${currentItems.length - updatedMenuItems.length} items\n`);

  let changedCount = 0;
  updatedMenuItems.forEach(newItem => {
    const existing = currentItems.find(c => c.id === newItem.id);
    if (!existing) {
      console.log(`[NEW / MERGED] #${newItem.id} ${newItem.name}`);
      changedCount++;
    } else if (existing.description !== newItem.description || existing.name !== newItem.name || existing.category !== newItem.category) {
      console.log(`[MODIFIED] #${newItem.id} ${newItem.name}`);
      if (existing.name !== newItem.name) console.log(`   Name: "${existing.name}" -> "${newItem.name}"`);
      if (existing.category !== newItem.category) console.log(`   Cat:  "${existing.category}" -> "${newItem.category}"`);
      console.log(`   Old desc: "${existing.description}"`);
      console.log(`   New desc: "${newItem.description}" (${newItem.description.length} chars)\n`);
      changedCount++;
    }
  });

  console.log(`Total changed items: ${changedCount}`);

  if (isWriteMode) {
    const fileContent = `// Smaakenzzoo Menu Dataset
// Artisanal Cafe, Warangal, Telangana
// Flourishing Hearts, Blooming Dreams

export const addOnOptionGroups = ${JSON.stringify(addOnOptionGroups, null, 2)};

export const menuItems = ${JSON.stringify(updatedMenuItems, null, 2)};
`;
    fs.writeFileSync(menuFilePath, fileContent, 'utf-8');
    console.log(`\n✓ Successfully wrote clean menu data to ${menuFilePath}`);
  } else {
    console.log('\n[DRY RUN COMPLETE] To apply changes to src/data/menu.js, run with --write');
  }

  if (process.argv.includes('--sync-firestore')) {
    console.log('\nSyncing updated descriptions to Firestore...');
    import('../src/firebase.js').then(async ({ db, COLLECTIONS }) => {
      const { writeBatch, doc } = await import('firebase/firestore');
      try {
        const batch = writeBatch(db);
        updatedMenuItems.forEach(item => {
          const itemRef = doc(db, COLLECTIONS.menuItems, item.id.toString());
          batch.set(itemRef, item, { merge: true });
        });
        await batch.commit();
        console.log(`✓ Successfully updated ${updatedMenuItems.length} items in Firestore!`);
      } catch (err) {
        console.error('Failed to sync to Firestore:', err);
      }
    }).catch(err => {
      console.error('Could not initialize Firebase connection:', err);
    });
  }
});
