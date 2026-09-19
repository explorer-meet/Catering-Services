import { PageIntro, StandaloneLayout } from "./GalleryPage";
import { unsplashPhoto } from "../utils/images";

const SERVICES = [
  { title: "Marriage", description: "Complete wedding planning and catering for a beautifully coordinated celebration.", image: "photo-1543353071-873f17a7a088" },
  { title: "Luxurious Catering", description: "Refined menus, polished presentation, and attentive service for premium occasions.", image: "photo-1515003197210-e0cd71810b5f" },
  { title: "Reception", description: "A welcoming reception experience with thoughtful food, flow, and hospitality.", image: "photo-1519167758481-83f550bb49b3" },
  { title: "Birthday Party", description: "Joyful celebrations with colorful vegetarian menus for every age group.", image: "photo-1530103862676-de8c9debad1d" },
  { title: "School Function", description: "Reliable event support and crowd-friendly catering for school occasions.", image: "photo-1523580494863-6f3031224c94" },
  { title: "Ring Ceremony", description: "An intimate engagement celebration designed around your special moment.", image: "photo-1519225421980-715cb0215aed" },
  { title: "Get Together", description: "Easygoing food and warm hosting for friends, families, and communities.", image: "photo-1511632765486-a01980e01a18" },
  { title: "Fashion Show", description: "Fast, elegant backstage and guest catering for high-energy productions.", image: "photo-1529139574466-a303027c1d8b" },
  { title: "College Function", description: "Flexible menus and smooth event service for campus celebrations.", image: "photo-1523240795612-9a054b0db644" },
  { title: "DJ Party Orchestra", description: "Late-night celebrations with energetic service and easy-to-enjoy food.", image: "photo-1492684223066-81342ee5ff30" },
  { title: "Raas Garba", description: "Traditional Gujarati celebration management with food, flow, and festive spirit.", image: "photo-1504609813442-a8924e83f76e" },
  { title: "Musical Night", description: "A seamless evening of music, hospitality, and memorable vegetarian catering.", image: "photo-1501386761578-eac5c94b800a" },
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
        {SERVICES.map((service) => (
          <article className="service-list-item" key={service.title}>
            <img
              src={unsplashPhoto(service.image, 560, 360)}
              alt={service.title}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                if (!event.currentTarget.dataset.fallback) {
                  event.currentTarget.dataset.fallback = "true";
                  event.currentTarget.src = unsplashPhoto("photo-1512621776951-a57141f2eefd", 560, 360);
                }
              }}
            />
            <div><h2>{service.title}</h2><p>{service.description}</p></div>
          </article>
        ))}
      </section>
      <div className="standalone-cta"><button className="btn btn-primary btn-large" onClick={onPlanEvent}>Plan your event</button></div>
    </StandaloneLayout>
  );
}
