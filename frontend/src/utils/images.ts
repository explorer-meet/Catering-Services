/// Builds a themed placeholder image URL (LoremFlickr filters random stock photos by keyword,
/// unlike Picsum which returns unrelated generic photography). `lock` pins a specific image
/// so the same tile doesn't change its photo between renders.
export function foodImage(keywords: string, width: number, height: number, lock: number): string {
  return `https://loremflickr.com/${width}/${height}/${keywords}?lock=${lock}`;
}

/// Curated, verified Unsplash photo IDs — real professional food/catering photography
/// (used instead of foodImage() wherever visual quality/relevance matters, e.g. hero, gallery).
export function unsplashPhoto(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&q=80&auto=format`;
}
