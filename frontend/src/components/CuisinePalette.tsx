import { useEffect, useState } from "react";
import { unsplashPhoto } from "../utils/images";

const CUISINES = [
  { name: "Indian", description: "Layered spices, comforting gravies, and joyful regional favorites.", hero: "photo-1546069901-ba9599a7e63c", satellites: ["photo-1540420773420-3366772f4999", "photo-1512621776951-a57141f2eefd", "photo-1547592180-85f173990554"] },
  { name: "Thai", description: "Bright herbs, fragrant curries, and balanced sweet-sour heat.", hero: "photo-1559314809-0d155014e29e", satellites: ["photo-1552566626-52f8b828add9", "photo-1515003197210-e0cd71810b5f", "photo-1547592180-85f173990554"] },
  { name: "Italian", description: "Hand-finished pasta, garden vegetables, and generous shared plates.", hero: "photo-1473093295043-cdd812d0e601", satellites: ["photo-1498837167922-ddd27525d352", "photo-1547592180-85f173990554", "photo-1512621776951-a57141f2eefd"] },
  { name: "Mexican", description: "Color, crunch, fresh salsas, and celebration-ready comfort food.", hero: "photo-1515003197210-e0cd71810b5f", satellites: ["photo-1552332386-f8dd00dc2f85", "photo-1540420773420-3366772f4999", "photo-1498837167922-ddd27525d352"] },
  { name: "Continental", description: "Elegant presentation with familiar flavors and modern finishing.", hero: "photo-1512621776951-a57141f2eefd", satellites: ["photo-1543353071-873f17a7a088", "photo-1473093295043-cdd812d0e601", "photo-1546069901-ba9599a7e63c"] },
];

export function CuisinePalette({ onPlanEvent }: { onPlanEvent: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cuisine = CUISINES[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % CUISINES.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  function move(direction: number) {
    setActiveIndex((current) => (current + direction + CUISINES.length) % CUISINES.length);
  }

  return (
    <section className="cuisine-palette section" aria-label="Cuisine showcase">
      <div className="cuisine-heading">
        <p className="page-eyebrow">Global Taste Palette</p>
        <h2 className="section-title">A world of flavour, one table</h2>
        <p className="section-subtitle">From regional Indian favorites to bright international plates, we curate menus around the way you want your celebration to feel.</p>
        <div className="cuisine-actions">
          <button className="cuisine-action" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>🍽️ <span>Explore cuisine</span></button>
          <button className="cuisine-action" onClick={onPlanEvent}>▤ <span>Menu planner</span></button>
        </div>
      </div>

      <div className="cuisine-stage">
        <button className="cuisine-arrow cuisine-arrow-left" onClick={() => move(-1)} aria-label="Previous cuisine">‹</button>
        <div className="cuisine-orbit cuisine-orbit-left"><img src={unsplashPhoto(cuisine.satellites[0], 260, 260)} alt="" loading="lazy" /></div>
        <div className="cuisine-orbit cuisine-orbit-right"><img src={unsplashPhoto(cuisine.satellites[1], 260, 260)} alt="" loading="lazy" /></div>
        <div className="cuisine-main-dish"><img src={unsplashPhoto(cuisine.hero, 700, 700)} alt={`${cuisine.name} vegetarian cuisine`} loading="lazy" /><span /></div>
        <div className="cuisine-title"><h3>{cuisine.name}</h3><p>{cuisine.description}</p></div>
        <button className="cuisine-arrow cuisine-arrow-right" onClick={() => move(1)} aria-label="Next cuisine">›</button>
      </div>
      <div className="cuisine-dots">{CUISINES.map((item, index) => <button key={item.name} className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show ${item.name} cuisine`} />)}</div>
    </section>
  );
}
