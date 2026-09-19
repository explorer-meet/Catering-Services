import { PageIntro, StandaloneLayout } from "./GalleryPage";
import { unsplashPhoto } from "../utils/images";

const SERVICES = [
  ["01", "Wedding catering", "Layered menus, live counters, and a calm service team for the biggest days.", "photo-1519741497674-611481863552"],
  ["02", "Birthday celebrations", "Colorful vegetarian spreads designed around your guests and the mood of the day.", "photo-1530103862676-de8c9debad1d"],
  ["03", "Corporate events", "Punctual, polished catering for meetings, launches, conferences, and team lunches.", "photo-1515187029135-18ee286d815b"],
  ["04", "Private celebrations", "Warm, flexible menus for intimate dinners, anniversaries, and family gatherings.", "photo-1519167758481-83f550bb49b3"],
  ["05", "Live food stations", "Freshly finished chaat, dosa, pasta, and dessert counters that become part of the experience.", "photo-1550547660-d9450f859349"],
  ["06", "Custom menus", "Tell us what matters to you and we will shape the menu, service, and presentation around it.", "photo-1543353071-873f17a7a088"],
];

interface ServicesPageProps {
  onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void;
  onPlanEvent: () => void;
}

export function ServicesPage({ onNavigate, onPlanEvent }: ServicesPageProps) {
  return (
    <StandaloneLayout onNavigate={onNavigate} onPlanEvent={onPlanEvent}>
      <PageIntro eyebrow="What we do" title="Catering with a point of view" description="From first idea to final plate, every detail is planned around your people, place, and occasion." />
      <section className="services-list" aria-label="Catering services">
        {SERVICES.map(([number, title, description, image]) => (
          <article className="service-list-item" key={title}>
            <span>{number}</span>
            <img src={unsplashPhoto(image, 560, 360)} alt={title} loading="lazy" />
            <div><h2>{title}</h2><p>{description}</p></div>
          </article>
        ))}
      </section>
      <div className="standalone-cta"><button className="btn btn-primary btn-large" onClick={onPlanEvent}>Plan your event</button></div>
    </StandaloneLayout>
  );
}
