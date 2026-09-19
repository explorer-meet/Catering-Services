import { ReactNode, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const GALLERY_ITEMS = [
  { label: "Vivah Events celebration", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/WhatsApp-Image-2026-03-30-at-11.52.16-AM.jpeg" },
  { label: "Catering arrangement", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/WhatsApp-Image-2026-03-30-at-11.40.11-AM.jpeg" },
  { label: "Event dining setup", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/WhatsApp-Image-2026-02-05-at-10.21.34-AM.jpeg" },
  { label: "Wedding celebration", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/WhatsApp-Image-2026-01-29-at-5.03.05-PM.jpeg" },
  { label: "Reception details", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/WhatsApp-Image-2026-01-29-at-1.45.53-PM.jpeg" },
  { label: "Festive event decor", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/27-04-2026.jpg.jpeg" },
  { label: "Celebration stage", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/24-04-2026-6.jpg.jpeg" },
  { label: "Special event setup", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/24-04-2026-4.jpg.jpeg" },
  { label: "Guest experience", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/24-04-2026-1.jpg.jpeg" },
  { label: "Live celebration", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/18-04-2026-4.png" },
  { label: "Event styling", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/18-04-2026-3.png" },
  { label: "Catering service", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/18-04-2026-1.png" },
  { label: "Family gathering", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/11-04-2026-4.jpg.jpeg" },
  { label: "Wedding moments", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/11-04-2026-3.jpg.jpeg" },
  { label: "Elegant venue", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/11-04-2026-2.jpg.jpeg" },
  { label: "Celebration table", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/08-05-2026-8.jpg.jpeg" },
  { label: "Decorated event space", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/08-05-2026-7.jpg.jpeg" },
  { label: "Vivah catering moment", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/08-05-2026.jpg.jpeg" },
  { label: "Festive hospitality", url: "https://www.vivahevent.in/wp-content/uploads/2026/05/06-04-2026-6.jpg.jpeg" },
  { label: "Memorable occasion", url: "https://www.vivahevent.in/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-28-at-3.47.47-PM.jpeg" },
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
            {!failed[index] && <img src={item.url} alt={item.label} loading="lazy" decoding="async" onError={() => setFailed((current) => ({ ...current, [index]: true }))} />}
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
