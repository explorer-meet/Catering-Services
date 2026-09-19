import { FeatureIcon, FeatureIconName } from "./FeatureIcon";

const FEATURES = [
  { icon: "planning" as FeatureIconName, title: "AI-Powered Planning", desc: "Get instant menu packages tailored to your budget and guest count." },
  { icon: "dietary" as FeatureIconName, title: "Veg, Jain & Vegan Options", desc: "Dietary-friendly menus without compromising on taste." },
  { icon: "chefs" as FeatureIconName, title: "Expert Chefs", desc: "Authentic regional cuisines crafted by experienced chefs." },
  { icon: "quotes" as FeatureIconName, title: "Transparent Quotes", desc: "Clear, itemized pricing with no hidden costs." },
  { icon: "service" as FeatureIconName, title: "On-Time Service", desc: "Punctual setup, service, and cleanup — every time." },
  { icon: "payments" as FeatureIconName, title: "Easy Payments", desc: "Secure online advance & balance payments with instant receipts." },
];

export function WhyChooseUs() {
  return (
    <section className="section section-alt why-section">
      <h2 className="section-title">Why Choose Vivah Caterers</h2>
      <p className="section-subtitle">Trusted by hundreds of families and businesses for flawless events.</p>
      <div className="why-us-tiles">
        {FEATURES.map((f) => (
          <div className="feature-tile" key={f.title}>
            <span className="feature-icon"><FeatureIcon name={f.icon} /></span>
            <div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
