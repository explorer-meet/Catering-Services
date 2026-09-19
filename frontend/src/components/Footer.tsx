import { BrandLogo } from "./BrandLogo";

export function Footer({ onNavigate }: { onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void }) {
  return (
    <footer id="contact" className="footer">
      <div className="footer-inner">
        <div>
          <BrandLogo light />
          <p>Crafting unforgettable culinary experiences since 2011.</p>
          <div className="footer-socials">
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">
              <svg className="instagram-icon" viewBox="0 0 24 24" aria-hidden="true">
                <defs><linearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2"><stop stopColor="#ffd600" /><stop offset=".45" stopColor="#ff0169" /><stop offset="1" stopColor="#7638fa" /></linearGradient></defs>
                <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="icon-fill" />
              </svg>
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
          <p className="footer-contact-detail"><span aria-hidden="true">☎</span><a href="tel:+919876543210">+91 98765 43210</a></p>
          <p className="footer-contact-detail"><span aria-hidden="true">✉</span><a href="mailto:hello@vivahcaterers.com">hello@vivahcaterers.com</a></p>
          <p className="footer-contact-detail"><span aria-hidden="true">⌖</span><span>Ahmedabad, Gujarat, India</span></p>
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
              href="mailto:hello@vivahcaterers.com?subject=Subscribe%20to%20Vivah%20Caterers%20updates"
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Vivah Caterers. All rights reserved.</p>
    </footer>
  );
}
