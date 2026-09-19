import { useState } from "react";
import { unsplashPhoto } from "../utils/images";

const GALLERY_ITEMS = [
  { label: "Wedding Mandap Dinner", id: "photo-1543353071-873f17a7a088" },
  { label: "Live Chaat Counter", id: "photo-1540420773420-3366772f4999" },
  { label: "Royal Thali Setup", id: "photo-1546069901-ba9599a7e63c" },
  { label: "Dessert Station", id: "photo-1495147466023-ac5c588e2e94" },
  { label: "Corporate Buffet", id: "photo-1498837167922-ddd27525d352" },
  { label: "Rooftop Celebration", id: "photo-1505253716362-afaea1d3d1af" },
];

export function Gallery({ onViewGallery }: { onViewGallery: () => void }) {
  const items = GALLERY_ITEMS;
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
        <a
          className="btn btn-outline"
          href="#gallery"
          onClick={(event) => {
            event.preventDefault();
            onViewGallery();
          }}
        >
          View Full Gallery →
        </a>
      </div>
    </section>
  );
}
