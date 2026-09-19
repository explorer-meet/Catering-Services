import { useState } from "react";
import { unsplashPhoto } from "../utils/images";

const SERVICES = [
  { icon: "💍", title: "Wedding Catering", desc: "Elaborate multi-cuisine menus with live counters for your big day.", id: "photo-1519741497674-611481863552" },
  { icon: "🎂", title: "Birthday Celebrations", desc: "Fun, colorful spreads tailored for every age group.", id: "photo-1530103862676-de8c9debad1d" },
  { icon: "🎓", title: "Farewell Parties", desc: "Memorable send-offs with comfort food and festive counters.", id: "photo-1523580494863-6f3031224c94" },
  { icon: "🥂", title: "Bachelor Parties", desc: "Trendy vegetarian small plates and beverage counters.", id: "photo-1540420773420-3366772f4999" },
  { icon: "💼", title: "Corporate Events", desc: "Professional service, business lunches, and conference catering.", id: "photo-1515187029135-18ee286d815b" },
  { icon: "✨", title: "Custom Events", desc: "Any celebration, any scale — we design a menu just for you.", id: "photo-1519167758481-83f550bb49b3" },
];

export function Services({ onViewMore }: { onViewMore: () => void }) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  return (
    <section id="services" className="section services-section">
      <p className="section-eyebrow">What we do</p>
      <h2 className="section-title">Catering crafted for your kind of celebration.</h2>
      <p className="section-subtitle">From the first welcome drink to the last sweet finish, every detail has a reason.</p>
      <div className="grid services-grid">
        {SERVICES.map((s, i) => (
          <div className="card service-card" key={s.title}>
            <div className={`service-card-image ${failed[i] ? "service-card-image-fallback" : ""}`}>
              {!failed[i] && (
                <img
                  src={unsplashPhoto(s.id, 400, 280)}
                  alt={s.title}
                  loading="lazy"
                  onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                />
              )}
              <span className="service-icon">{s.icon}</span>
              <span className="service-index">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="services-cta">
        <button className="btn btn-outline btn-large" onClick={onViewMore}>
          View More Services <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
