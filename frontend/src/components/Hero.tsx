import { useEffect, useState } from "react";
import { unsplashPhoto } from "../utils/images";

interface HeroProps {
  onPlanEvent: () => void;
  onViewServices: () => void;
}

const HERO_SLIDES = [
  { id: "photo-1547592180-85f173990554", alt: "Colorful vegetarian curry spread" },
  { id: "photo-1515003197210-e0cd71810b5f", alt: "Fresh vegetarian dishes at a catered event" },
  { id: "photo-1543353071-873f17a7a088", alt: "Beautifully arranged vegetarian food spread" },
];

export function Hero({ onPlanEvent, onViewServices }: HeroProps) {
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
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
            />
          ),
        )}
      <div className="hero-content">
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
          <button className="btn btn-outline btn-large" onClick={onViewServices}>
            Explore Services
          </button>
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

      <button className="hero-scroll-cue" onClick={onViewServices} aria-label="Explore services">
        ↓
      </button>
    </section>
  );
}

