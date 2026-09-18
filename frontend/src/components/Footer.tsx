export function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footer-inner">
        <div>
          <div className="brand">
            <span className="brand-mark">V</span>
            <span className="brand-name">
              Vivah <em>Caterers</em>
            </span>
          </div>
          <p>Crafting unforgettable culinary experiences since 2011.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="WhatsApp">💬</a>
          </div>
        </div>
        <div>
          <h4>Contact</h4>
          <p>📞 +91 98765 43210</p>
          <p>✉️ hello@vivahcaterers.com</p>
          <p>📍 Ahmedabad, Gujarat, India</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <p><a href="#services">Services</a></p>
          <p><a href="#gallery">Gallery</a></p>
          <p><a href="#testimonials">Testimonials</a></p>
        </div>
        <div>
          <h4>Stay Updated</h4>
          <p>Get seasonal menus and offers in your inbox.</p>
          <div className="footer-newsletter">
            <input type="email" placeholder="Your email address" />
            <button className="btn btn-gold" type="button">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Vivah Caterers. All rights reserved.</p>
    </footer>
  );
}
