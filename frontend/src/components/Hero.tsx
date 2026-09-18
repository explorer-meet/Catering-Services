import { useEffect, useState } from "react";
import { unsplashPhoto } from "../utils/images";

interface HeroProps {
  onPlanEvent: () => void;
}

const HERO_SLIDES = [
  { id: "photo-1555244162-803834f70033", alt: "Elegantly plated gourmet dish" },
  { id: "photo-1547573854-74d2a71d0826", alt: "Rich curry served at a catered event" },
  { id: "photo-1596797038530-2c107229654b", alt: "Beautifully arranged festive food spread" },
];

export function Hero({ onPlanEvent }: HeroProps) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const allFailed = HERO_SLIDES.every((_, i) => failed[i]);

  return (
    <section className="hero">
      {!allFailed &&
        HERO_SLIDES.map((slide, i) =>
          failed[i] ? null : (
            <img
              key={slide.id}
              className={`hero-bg ${i === activeSlide ? "hero-bg-active" : ""}`}
              src={unsplashPhoto(slide.id, 1600, 900)}
              alt={slide.alt}
              onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
            />
          ),
        )}
      <div className="hero-content">
        <p className="hero-badge">⭐⭐⭐⭐⭐ Rated 4.9 by 500+ happy clients</p>
        <p className="hero-kicker">Weddings · Celebrations · Corporate Events</p>
        <h1>
          Crafting Unforgettable
          <br />
          <span className="hero-highlight">Culinary Experiences</span>
        </h1>
        <p className="hero-subtext">
          From intimate gatherings to grand weddings, Vivah Caterers brings authentic flavors,
          flawless service, and AI-powered menu planning to every plate.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-large" onClick={onPlanEvent}>
            ✨ Plan Your Event Now
          </button>
          <a className="btn btn-outline btn-large" href="#services">
            Explore Services
          </a>
        </div>
      </div>

      <div className="hero-slide-dots">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            className={`hero-slide-dot ${i === activeSlide ? "active" : ""}`}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setActiveSlide(i)}
          />
        ))}
      </div>

      <a className="hero-scroll-cue" href="#services" aria-label="Scroll to explore">
        ↓
      </a>
    </section>
  );
}

