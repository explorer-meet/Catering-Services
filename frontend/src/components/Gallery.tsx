const GALLERY_ITEMS = [
  { label: "Wedding Mandap Dinner", seed: "vivah-wedding-mandap" },
  { label: "Live Chaat Counter", seed: "vivah-live-chaat" },
  { label: "Royal Thali Setup", seed: "vivah-royal-thali" },
  { label: "Dessert Station", seed: "vivah-dessert-station" },
  { label: "Corporate Buffet", seed: "vivah-corporate-buffet" },
  { label: "Rooftop Bachelor Party", seed: "vivah-rooftop-party" },
];

export function Gallery() {
  return (
    <section id="gallery" className="section">
      <h2 className="section-title">Moments We've Catered</h2>
      <p className="section-subtitle">A glimpse of our recent celebrations.</p>
      <div className="grid gallery-grid">
        {GALLERY_ITEMS.map((item) => (
          <div className="gallery-tile" key={item.label}>
            <img
              src={`https://picsum.photos/seed/${item.seed}/480/360`}
              alt={item.label}
              loading="lazy"
            />
            <div className="gallery-hover">
              <span className="gallery-hover-icon">🔍</span>
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="gallery-cta">
        <a className="btn btn-outline" href="#contact">
          View Full Gallery →
        </a>
      </div>
    </section>
  );
}
