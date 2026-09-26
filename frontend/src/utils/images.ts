/// Curated, verified Unsplash photo IDs — real professional food/catering photography
export function unsplashPhoto(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&q=80&auto=format`;
}

const FOOD_PHOTO_KEYWORDS: { photo: string; match: string[] }[] = [
  { photo: "photo-1473093295043-cdd812d0e601", match: ["pizza", "pasta", "italian", "bread", "garlic", "roti", "naan", "tandoor"] },
  { photo: "photo-1547592180-85f173990554", match: ["soup", "shorba", "broth", "dal", "curry", "gravy", "sabzi", "kadhi"] },
  { photo: "photo-1540420773420-3366772f4999", match: ["starter", "snack", "chaat", "tikka", "kebab", "appetiz", "paneer", "tandoori"] },
  { photo: "photo-1495147466023-ac5c588e2e94", match: ["dessert", "sweet", "cake", "ice", "gulab", "halwa", "kheer", "jamun", "mithai"] },
  { photo: "photo-1512621776951-a57141f2eefd", match: ["salad", "raita", "green", "continental", "salsa", "veg"] },
  { photo: "photo-1559314809-0d155014e29e", match: ["rice", "biryani", "pulao", "noodle", "thai", "chinese", "hakka", "fried"] },
  { photo: "photo-1515003197210-e0cd71810b5f", match: ["mexican", "taco", "nacho", "wrap", "roll", "sandwich", "burger"] },
  { photo: "photo-1552566626-52f8b828add9", match: ["drink", "juice", "mocktail", "beverage", "tea", "coffee", "shake", "lassi"] },
  { photo: "photo-1498837167922-ddd27525d352", match: ["buffet", "counter", "live", "corporate", "platter"] },
  { photo: "photo-1546069901-ba9599a7e63c", match: ["thali", "main", "course", "punjabi", "gujarati", "indian", "combo"] },
];

const FALLBACK_PHOTOS = FOOD_PHOTO_KEYWORDS.map((entry) => entry.photo);

/// Picks a food photo for a category or dish name, falling back to a stable
/// name-hashed choice so the same tile always shows the same picture.
export function foodPhoto(name: string, size = 120): string {
  const lower = name.toLowerCase();
  const matched = FOOD_PHOTO_KEYWORDS.find((entry) => entry.match.some((word) => lower.includes(word)));
  if (matched) return unsplashPhoto(matched.photo, size, size);

  let hash = 0;
  for (const char of lower) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return unsplashPhoto(FALLBACK_PHOTOS[hash % FALLBACK_PHOTOS.length], size, size);
}
