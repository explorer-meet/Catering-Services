const HIGHLIGHTS = [
  "🎉 500+ Events Catered",
  "🌿 Veg, Jain & Vegan Menus",
  "🤖 AI-Powered Menu Planning",
  "👨‍🍳 Expert Chefs",
  "💳 Secure Online Payments",
  "🚚 On-Time Setup & Service",
  "📋 Instant Quotations",
  "⭐ 4.9 Rated by Clients",
];

/// Continuously scrolling ticker strip — the list is duplicated for a seamless loop
export function Marquee() {
  const items = [...HIGHLIGHTS, ...HIGHLIGHTS];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span className="marquee-item" key={i}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
