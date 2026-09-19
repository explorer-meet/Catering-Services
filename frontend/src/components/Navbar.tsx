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
          <a
            className="navbar-whatsapp"
            href="https://wa.me/919974700749"
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with Vivah Events on WhatsApp at 99747 00749"
            title="WhatsApp: 99747 00749"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.3-6.1-3.5-8.3Zm-8.4 18.1h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.9 1 1-3.8-.3-.4a9.8 9.8 0 1 1 8.7 4.8Zm5.4-7.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2l-.8 1c-.2.2-.4.3-.7.1-2.4-1.2-4-2.1-5.6-4.8-.4-.7.4-.6 1.1-2 0-.3 0-.5-.1-.7l-.7-1.8c-.2-.5-.4-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.2 3.3c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.8.6-.1 1.7-.7 1.9-1.4.3-.7.3-1.3.2-1.4Z" />
            </svg>
          </a>
          <button className="btn btn-primary" onClick={onPlanEvent}>
            Plan Your Event
          </button>
        </div>
      </div>
    </header>
  );
}
