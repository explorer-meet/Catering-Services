/// Curated, verified Unsplash photo IDs — real professional food/catering photography
export function unsplashPhoto(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&q=80&auto=format`;
}
