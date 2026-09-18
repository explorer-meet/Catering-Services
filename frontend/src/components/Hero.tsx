interface HeroProps {
  onPlanEvent: () => void;
}

export function Hero({ onPlanEvent }: HeroProps) {
  return (
    <section className="hero">
      <img
        className="hero-bg"
        src="https://picsum.photos/seed/vivah-hero-banquet/1600/900"
        alt=""
        aria-hidden="true"
      />
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

      <div className="hero-stats">
        <div>
          <strong>500+</strong>
          <span>Events Catered</span>
        </div>
        <div>
          <strong>15+</strong>
          <span>Years of Excellence</span>
        </div>
        <div>
          <strong>50+</strong>
          <span>Menu Combinations</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>On-Time Delivery</span>
        </div>
      </div>
    </section>
  );
}

