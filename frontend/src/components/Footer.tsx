import { BrandLogo } from "./BrandLogo";
import { ContactIcon } from "./ContactIcon";

export function Footer({ onNavigate }: { onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void }) {
  return (
    <footer id="contact" className="footer">
      <div className="footer-inner">
        <div className="footer-brand-column">
          <BrandLogo light />
          <p>Crafting unforgettable culinary experiences since 2011.</p>
          <div className="footer-socials">
            <a href="https://www.facebook.com/vivahevents2012" aria-label="Facebook" target="_blank" rel="noreferrer">f</a>
            <a href="https://www.instagram.com/vivahevents2012/?hl=en" aria-label="Instagram" target="_blank" rel="noreferrer">
              <svg className="instagram-icon" viewBox="0 0 24 24" aria-hidden="true">
                <defs><linearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2"><stop stopColor="#ffd600" /><stop offset=".45" stopColor="#ff0169" /><stop offset="1" stopColor="#7638fa" /></linearGradient></defs>
                <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="icon-fill" />
              </svg>
            </a>
            <a href="https://www.youtube.com/@vaishalishah7972" aria-label="YouTube" target="_blank" rel="noreferrer">
              <svg className="youtube-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>
            </a>
            <a href="https://wa.me/918758770402" aria-label="WhatsApp" target="_blank" rel="noreferrer">
              <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.3-6.1-3.5-8.3Zm-8.4 18.1h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.9 1 1-3.8-.3-.4a9.8 9.8 0 1 1 8.7 4.8Zm5.4-7.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2l-.8 1c-.2.2-.4.3-.7.1-2.4-1.2-4-2.1-5.6-4.8-.4-.7.4-.6 1.1-2 0-.3 0-.5-.1-.7l-.7-1.8c-.2-.5-.4-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.2 3.3c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.8.6-.1 1.7-.7 1.9-1.4.3-.7.3-1.3.2-1.4Z" />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <h4>Contact</h4>
          <p className="footer-contact-detail"><span className="footer-contact-icon"><ContactIcon name="phone" /></span><a href="tel:+919974700749">+91 99747 00749</a></p>
          <p className="footer-contact-detail"><span className="footer-contact-icon"><ContactIcon name="mail" /></span><a href="mailto:vivahevents2012@gmail.com">vivahevents2012@gmail.com</a></p>
          <p className="footer-contact-detail"><span className="footer-contact-icon"><ContactIcon name="location" /></span><span>GF-17, Nakshatra Mall, Nr. Canara Bank, IOC Road, Chandkheda, Ahmedabad-382424, Gujarat</span></p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <p><a href="#services" onClick={(event) => { event.preventDefault(); onNavigate("services"); }}>Services</a></p>
          <p><a href="#gallery" onClick={(event) => { event.preventDefault(); onNavigate("gallery"); }}>Gallery</a></p>
          <p><a href="#testimonials">Testimonials</a></p>
          <p><a href="#contact" onClick={(event) => { event.preventDefault(); onNavigate("contact"); }}>Contact</a></p>
        </div>
        <div>
          <h4>Stay Updated</h4>
          <p>Get seasonal menus and offers in your inbox.</p>
          <div className="footer-newsletter">
            <input type="email" placeholder="Your email address" />
            <a
              className="btn btn-gold"
              href="mailto:vivahevents2012@gmail.com?subject=Subscribe%20to%20Vivah%20Events%20updates"
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
      <p className="footer-copy">
        © {new Date().getFullYear()} Vivah Caterers. All rights reserved. · <a href="#owner">Owner Console</a>
      </p>
    </footer>
  );
}
