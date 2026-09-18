import { useState } from "react";
import { unsplashPhoto } from "../utils/images";

const GALLERY_ITEMS = [
  { label: "Wedding Mandap Dinner", id: "photo-1519671482749-fd09be7ccebf" },
  { label: "Live Chaat Counter", id: "photo-1550547660-d9450f859349" },
  { label: "Royal Thali Setup", id: "photo-1631515243349-e0cb75fb8d3a" },
  { label: "Dessert Station", id: "photo-1546069901-ba9599a7e63c" },
  { label: "Corporate Buffet", id: "photo-1512621776951-a57141f2eefd" },
  { label: "Rooftop Bachelor Party", id: "photo-1466637574441-749b8f19452f" },
];

export function Gallery() {
  const items = [...GALLERY_ITEMS, ...GALLERY_ITEMS];
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  return (
    <section id="gallery" className="section gallery-section">
      <h2 className="section-title">Moments We've Catered</h2>
      <p className="section-subtitle">A glimpse of our recent celebrations.</p>
      <div className="gallery-scroller">
        <div className="gallery-track">
          {items.map((item, i) => (
            <div className={`gallery-tile ${failed[i] ? "gallery-tile-fallback" : ""}`} key={`${item.label}-${i}`}>
              {!failed[i] && (
                <img
                  src={unsplashPhoto(item.id, 480, 360)}
                  alt={item.label}
                  loading="lazy"
                  onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                />
              )}
              <div className="gallery-hover">
                <span className="gallery-hover-icon">🔍</span>
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="gallery-cta">
        <a className="btn btn-outline" href="#contact">
          View Full Gallery →
        </a>
      </div>
    </section>
  );
}
