import { ReactNode, useState } from "react";
import { unsplashPhoto } from "../utils/images";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const GALLERY_ITEMS = [
  { label: "Wedding Mandap Dinner", id: "photo-1543353071-873f17a7a088" },
  { label: "Live Chaat Counter", id: "photo-1540420773420-3366772f4999" },
  { label: "Royal Thali Setup", id: "photo-1546069901-ba9599a7e63c" },
  { label: "Dessert Station", id: "photo-1495147466023-ac5c588e2e94" },
  { label: "Corporate Buffet", id: "photo-1498837167922-ddd27525d352" },
  { label: "Rooftop Celebration", id: "photo-1505253716362-afaea1d3d1af" },
  { label: "Fresh Salad Bar", id: "photo-1512621776951-a57141f2eefd" },
  { label: "Festive Family Table", id: "photo-1547592180-85f173990554" },
];

interface GalleryPageProps {
  onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void;
  onPlanEvent: () => void;
}

export function GalleryPage({ onNavigate, onPlanEvent }: GalleryPageProps) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  return (
    <StandaloneLayout onNavigate={onNavigate} onPlanEvent={onPlanEvent}>
      <PageIntro eyebrow="Our work" title="A table full of memories" description="Explore the vegetarian spreads, live counters, and thoughtful details we bring to every celebration." />
      <section className="standalone-gallery" aria-label="Catering gallery">
        {GALLERY_ITEMS.map((item, index) => (
          <figure className={`standalone-gallery-item ${failed[index] ? "image-fallback" : ""}`} key={item.label}>
            {!failed[index] && <img src={unsplashPhoto(item.id, 640, 480)} alt={item.label} loading="lazy" decoding="async" onError={() => setFailed((current) => ({ ...current, [index]: true }))} />}
            <figcaption>{item.label}</figcaption>
          </figure>
        ))}
      </section>
    </StandaloneLayout>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="standalone-header">
      <p className="page-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function StandaloneLayout({ children, onNavigate, onPlanEvent }: { children: ReactNode; onNavigate: GalleryPageProps["onNavigate"]; onPlanEvent: () => void }) {
  return <><Navbar onPlanEvent={onPlanEvent} onNavigate={onNavigate} /><main className="standalone-page">{children}</main><Footer onNavigate={onNavigate} /></>;
}
