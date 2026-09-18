interface NavbarProps {
  onPlanEvent: () => void;
}

export function Navbar({ onPlanEvent }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span className="brand-name">
            Vivah <em>Caterers</em>
          </span>
        </div>
        <nav className="nav-links">
          <a href="#services">Services</a>
          <a href="#gallery">Gallery</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
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
