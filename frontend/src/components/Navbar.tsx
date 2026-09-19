import { BrandLogo } from "./BrandLogo";

interface NavbarProps {
  onPlanEvent: () => void;
  onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void;
}

export function Navbar({ onPlanEvent, onNavigate }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a className="brand" href="#top" aria-label="Vivah Caterers home" onClick={(event) => { event.preventDefault(); onNavigate("landing"); }}>
          <BrandLogo />
        </a>
        <nav className="nav-links">
          <a href="#services" onClick={(event) => { event.preventDefault(); onNavigate("services"); }}>Services</a>
          <a href="#gallery" onClick={(event) => { event.preventDefault(); onNavigate("gallery"); }}>Gallery</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact" onClick={(event) => { event.preventDefault(); onNavigate("contact"); }}>Contact</a>
        </nav>
        <div className="navbar-actions">
          <a className="navbar-phone" href="tel:+919876543210">
            📞 <span>+91 98765 43210</span>
          </a>
          <button className="btn btn-primary" onClick={onPlanEvent}>
            Plan Your Event
          </button>
        </div>
      </div>
    </header>
  );
}
