import { FoodType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ItemSeed {
  name: string;
  cuisine?: string;
  foodType?: FoodType;
  costPerPlate: number;
  isJainSafe?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  containsOnionGarlic?: boolean;
}

interface CategorySeed {
  name: string;
  description: string;
  displayOrder: number;
  pricing: {
    fifty: { min: number; max: number };
    hundred: { min: number; max: number };
  };
  items: ItemSeed[];
}

/// Distributes cost roughly between a min/max band based on item index, for realistic variance
function bandedCost(index: number, count: number, min: number, max: number): number {
  const ratio = count <= 1 ? 0 : index / (count - 1);
  return Math.round(min + ratio * (max - min));
}

function items(names: string[], opts: Partial<ItemSeed> & { costMin: number; costMax: number }): ItemSeed[] {
  return names.map((name, i) => ({
    name,
    cuisine: opts.cuisine,
    foodType: opts.foodType ?? "VEG",
    costPerPlate: bandedCost(i, names.length, opts.costMin, opts.costMax),
    isJainSafe: opts.isJainSafe ?? false,
    isVegan: opts.isVegan ?? false,
    isGlutenFree: opts.isGlutenFree ?? false,
    containsOnionGarlic: opts.containsOnionGarlic ?? true,
  }));
}

const CATEGORIES: CategorySeed[] = [
  {
    name: "Soup",
    description: "Hot appetizer soups served before the main course.",
    displayOrder: 1,
    pricing: { fifty: { min: 50, max: 80 }, hundred: { min: 45, max: 65 } },
    items: items(
      [
        "Tomato Basil Soup", "Sweet Corn Veg Soup", "Manchow Soup", "Hot & Sour Soup",
        "Cream of Mushroom Soup", "Lemon Coriander Soup", "Minestrone Soup", "Broccoli Almond Soup",
        "Spinach Corn Soup", "Roasted Tomato Soup", "Cream of Broccoli Soup", "Palak Soup",
        "Pumpkin Soup", "Carrot Ginger Soup", "Vegetable Clear Soup", "Sweet Potato Soup",
        "Veg Thukpa", "Rasam Soup", "Coconut Vegetable Soup", "Cream of Celery Soup",
        "Beetroot Soup", "Mixed Vegetable Soup", "Talumein Soup", "Veg Wonton Soup", "Cauliflower Soup",
      ],
      { cuisine: "Multi-cuisine", costMin: 25, costMax: 45, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Mocktail",
    description: "Non-alcoholic refreshing beverages served as a welcome drink.",
    displayOrder: 2,
    pricing: { fifty: { min: 60, max: 90 }, hundred: { min: 55, max: 80 } },
    items: items(
      [
        "Virgin Mojito", "Blue Lagoon", "Watermelon Cooler", "Strawberry Colada", "Kiwi Crush",
        "Virgin Pina Colada", "Green Apple Fizz", "Mango Tango", "Cranberry Splash", "Litchi Delight",
        "Fruit Punch", "Peach Ice Tea", "Masala Soda", "Shirley Temple", "Passion Fruit Mocktail",
      ],
      { cuisine: "Beverages", costMin: 20, costMax: 40, containsOnionGarlic: false, isJainSafe: true, isVegan: true },
    ),
  },
  {
    name: "Starters",
    description: "Veg starters and appetizers served hot at live counters.",
    displayOrder: 3,
    pricing: { fifty: { min: 120, max: 180 }, hundred: { min: 100, max: 150 } },
    items: items(
      [
        "Paneer Tikka", "Hara Bhara Kabab", "Dahi Puri", "Chilli Paneer", "Crispy Corn Chaat",
        "Veg Manchurian", "Paneer 65", "Achari Paneer Tikka", "Chatpata Aloo Chaat",
        "Baby Corn Manchurian", "Malai Soya Chaap", "Cheese Corn Balls", "Veg Seekh Kabab",
        "Paneer Malai Tikka", "Crispy Vegetable Spring Roll", "Honey Chilli Potato",
        "Tandoori Mushroom", "Paneer Lollipop", "Sabudana Vada", "Veg Cutlet", "Bhutta Kebab",
        "Paneer Chilli Dry", "Stuffed Mushroom", "Amritsari Chole Tikki", "Corn Cheese Nuggets",
        "Tandoori Broccoli", "Paneer Angara Tikka", "Aloo Tikki Chaat", "Kurkuri Bhindi",
        "Paneer Pakora", "Vegetable Kebab Platter", "Til Paneer Tikka", "Schezwan Paneer Skewers",
        "Rajma Galouti", "Hariyali Paneer Tikka",
      ],
      { cuisine: "Multi-cuisine", costMin: 45, costMax: 75 },
    ),
  },
  {
    name: "Salad Bar",
    description: "Fresh salads and raitas served as accompaniments.",
    displayOrder: 4,
    pricing: { fifty: { min: 40, max: 60 }, hundred: { min: 35, max: 50 } },
    items: items(
      [
        "Kachumber Salad", "Greek Salad", "Fruit Chaat", "Sprouts Salad", "Russian Salad",
        "Coleslaw", "Veg Caesar Salad", "Boondi Raita", "Corn & Peas Salad", "Chickpea Salad",
        "Beetroot Carrot Salad", "Pasta Salad",
      ],
      { cuisine: "Continental", costMin: 15, costMax: 30, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Juice Bar",
    description: "Freshly prepared juices and coolers.",
    displayOrder: 5,
    pricing: { fifty: { min: 30, max: 50 }, hundred: { min: 25, max: 40 } },
    items: items(
      [
        "Fresh Orange Juice", "Watermelon Juice", "Mosambi Juice", "Pineapple Juice",
        "Mixed Fruit Juice", "Sugarcane Juice", "Aam Panna", "Pomegranate Juice",
        "Muskmelon Juice", "Grape Juice", "Guava Juice", "Coconut Water",
      ],
      { cuisine: "Beverages", costMin: 12, costMax: 25, containsOnionGarlic: false, isJainSafe: true, isVegan: true },
    ),
  },
  {
    name: "Thai Cuisine",
    description: "Authentic Thai dishes prepared by specialty chefs.",
    displayOrder: 6,
    pricing: { fifty: { min: 150, max: 220 }, hundred: { min: 130, max: 190 } },
    items: items(
      [
        "Tom Yum Soup (Veg)", "Thai Green Curry (Veg)", "Thai Red Curry (Veg)", "Pad Thai Noodles",
        "Thai Basil Fried Rice", "Som Tam Papaya Salad", "Thai Style Veg Spring Rolls",
        "Thai Glass Noodle Salad", "Massaman Curry (Veg)", "Thai Sticky Rice with Mango",
        "Thai Fried Rice", "Tofu Satay", "Thai Clear Soup", "Panang Curry (Veg)",
        "Thai Vegetable Stir Fry",
      ],
      { cuisine: "Thai", costMin: 60, costMax: 95, containsOnionGarlic: true },
    ),
  },
  {
    name: "Singaporean Cuisine",
    description: "Popular Singaporean street-food style dishes.",
    displayOrder: 7,
    pricing: { fifty: { min: 140, max: 200 }, hundred: { min: 120, max: 170 } },
    items: items(
      [
        "Singapore Rice Noodles", "Singaporean Chilli Paneer", "Vegetable Laksa",
        "Singapore Fried Rice", "Chilli Baby Corn Singapore Style", "Vegetable Hokkien Mee",
        "Singapore Vegetable Manchurian", "Veg Kaya Toast", "Roti Prata with Curry",
        "Vegetable Dumplings Singapore Style", "Singapore Sweet & Sour Vegetables",
        "Nonya Curry Vegetables",
      ],
      { cuisine: "Singaporean", costMin: 55, costMax: 90 },
    ),
  },
  {
    name: "Sri Lankan Cuisine",
    description: "Traditional Sri Lankan vegetarian specialities.",
    displayOrder: 8,
    pricing: { fifty: { min: 130, max: 190 }, hundred: { min: 110, max: 160 } },
    items: items(
      [
        "Sri Lankan Vegetable Kottu", "Coconut Sambol", "Sri Lankan Dhal Curry",
        "Vegetable String Hoppers", "Sri Lankan Vegetable Curry", "Pol Roti",
        "Plain Hoppers", "Beetroot Curry Sri Lankan Style", "Gotu Kola Salad",
        "Jackfruit Curry", "Sri Lankan Coconut Rice", "Ash Plantain Curry",
      ],
      { cuisine: "Sri Lankan", costMin: 50, costMax: 85, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Main Course",
    description: "Rich gravies and curries served as the main meal.",
    displayOrder: 9,
    pricing: { fifty: { min: 150, max: 220 }, hundred: { min: 130, max: 190 } },
    items: items(
      [
        "Paneer Butter Masala", "Undhiyu", "Jain Kadhi", "Veg Kolhapuri", "Malai Kofta",
        "Dum Aloo Kashmiri", "Vegetable Handi", "Kadai Paneer", "Methi Malai Paneer",
        "Lasooni Palak", "Chana Masala", "Shahi Paneer",
      ],
      { cuisine: "Punjabi/Gujarati", costMin: 70, costMax: 110 },
    ),
  },
  {
    name: "Breads",
    description: "Freshly prepared Indian breads from the tandoor.",
    displayOrder: 10,
    pricing: { fifty: { min: 20, max: 35 }, hundred: { min: 18, max: 30 } },
    items: items(
      [
        "Tandoori Roti", "Butter Naan", "Puri", "Missi Roti", "Lachha Paratha",
        "Garlic Naan", "Stuffed Kulcha", "Bajra Roti", "Roomali Roti", "Cheese Naan",
      ],
      { cuisine: "Punjabi", costMin: 10, costMax: 22, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Rice",
    description: "Rice preparations and biryanis.",
    displayOrder: 11,
    pricing: { fifty: { min: 40, max: 60 }, hundred: { min: 35, max: 50 } },
    items: items(
      [
        "Jeera Rice", "Veg Biryani", "Steamed Rice", "Peas Pulao", "Kashmiri Pulao",
        "Curd Rice", "Veg Fried Rice", "Saffron Rice", "Hyderabadi Veg Dum Biryani",
        "Lemon Rice",
      ],
      { cuisine: "Multi-cuisine", costMin: 18, costMax: 32, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Dal",
    description: "Lentil preparations served with rice or breads.",
    displayOrder: 12,
    pricing: { fifty: { min: 30, max: 45 }, hundred: { min: 25, max: 40 } },
    items: items(
      [
        "Dal Fry", "Gujarati Dal", "Dal Makhani", "Panchmel Dal", "Dal Tadka",
        "Yellow Moong Dal", "Rajasthani Dal", "Dal Palak",
      ],
      { cuisine: "Multi-cuisine", costMin: 12, costMax: 24, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Desserts",
    description: "Traditional and modern sweets to end the meal.",
    displayOrder: 13,
    pricing: { fifty: { min: 50, max: 80 }, hundred: { min: 45, max: 70 } },
    items: items(
      [
        "Gulab Jamun", "Mohanthal", "Rasmalai", "Gajar Ka Halwa", "Moong Dal Halwa",
        "Kesar Pista Kulfi", "Jalebi with Rabri", "Chocolate Mousse", "Fruit Custard",
        "Malpua", "Basundi", "Shrikhand",
      ],
      { cuisine: "Multi-cuisine", costMin: 20, costMax: 40, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Beverages",
    description: "Hot and cold beverages served through the event.",
    displayOrder: 14,
    pricing: { fifty: { min: 20, max: 35 }, hundred: { min: 18, max: 30 } },
    items: items(
      ["Masala Chaas", "Soft Drinks", "Masala Tea", "Filter Coffee", "Badam Milk", "Thandai"],
      { cuisine: "Beverages", costMin: 8, costMax: 18, containsOnionGarlic: false, isJainSafe: true },
    ),
  },
  {
    name: "Live Counter",
    description: "Chef-manned live cooking stations.",
    displayOrder: 15,
    pricing: { fifty: { min: 150, max: 250 }, hundred: { min: 130, max: 220 } },
    items: items(
      [
        "Live Dosa Counter", "Live Pasta Counter", "Live Chaat Counter", "Live Pani Puri Counter",
        "Live Momo Counter", "Live Grill Counter", "Live Pizza Counter", "Live Ice Cream Counter",
      ],
      { cuisine: "Multi-cuisine", costMin: 60, costMax: 100 },
    ),
  },
  {
    name: "Kids Menu",
    description: "Fun and simple dishes designed for younger guests.",
    displayOrder: 16,
    pricing: { fifty: { min: 60, max: 90 }, hundred: { min: 50, max: 80 } },
    items: items(
      [
        "Mini Burger & Fries", "Veg Cheese Sandwich", "Pasta in White Sauce", "Mini Pizza",
        "Veg Nuggets", "Cheese Balls", "Noodles Bowl", "Potato Wedges",
      ],
      { cuisine: "Continental", costMin: 30, costMax: 50 },
    ),
  },
];

async function main() {
  for (const category of CATEGORIES) {
    const created = await prisma.menuCategory.create({
      data: {
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        items: { create: category.items },
        pricingTiers: {
          create: [
            {
              guestTier: "FIFTY",
              minPricePerPerson: category.pricing.fifty.min,
              maxPricePerPerson: category.pricing.fifty.max,
            },
            {
              guestTier: "HUNDRED",
              minPricePerPerson: category.pricing.hundred.min,
              maxPricePerPerson: category.pricing.hundred.max,
            },
          ],
        },
      },
      include: { items: true },
    });
    console.log(`Seeded category "${created.name}" with ${created.items.length} items.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
