const SERVICES = [
  { icon: "💍", title: "Wedding Catering", desc: "Elaborate multi-cuisine menus with live counters for your big day.", seed: "vivah-service-wedding" },
  { icon: "🎂", title: "Birthday Celebrations", desc: "Fun, colorful spreads tailored for every age group.", seed: "vivah-service-birthday" },
  { icon: "🎓", title: "Farewell Parties", desc: "Memorable send-offs with comfort food and festive counters.", seed: "vivah-service-farewell" },
  { icon: "🥂", title: "Bachelor Parties", desc: "Trendy small plates, grills, and beverage counters.", seed: "vivah-service-bachelor" },
  { icon: "💼", title: "Corporate Events", desc: "Professional service, business lunches, and conference catering.", seed: "vivah-service-corporate" },
  { icon: "✨", title: "Custom Events", desc: "Any celebration, any scale — we design a menu just for you.", seed: "vivah-service-custom" },
];

export function Services() {
  return (
    <section id="services" className="section">
      <h2 className="section-title">Our Catering Services</h2>
      <p className="section-subtitle">Every event deserves a menu as unique as the occasion.</p>
      <div className="grid services-grid">
        {SERVICES.map((s, i) => (
          <div className="card service-card" key={s.title}>
            <div className="service-card-image">
              <img src={`https://picsum.photos/seed/${s.seed}/400/280`} alt={s.title} loading="lazy" />
              <span className="service-icon">{s.icon}</span>
              <span className="service-index">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
