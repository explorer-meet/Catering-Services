const TESTIMONIALS = [
  {
    quote: "Vivah Caterers made our wedding feel royal. The Gujarati-Punjabi fusion menu was a huge hit with 500+ guests!",
    author: "Priya & Karan",
    event: "Wedding, Ahmedabad",
    seed: "vivah-testimonial-1",
  },
  {
    quote: "The AI menu recommendations saved us so much time. We customized the menu in minutes and got the quotation instantly.",
    author: "Rohan Mehta",
    event: "Corporate Annual Day",
    seed: "vivah-testimonial-2",
  },
  {
    quote: "Professional staff, delicious food, and transparent pricing. Highly recommend for any celebration.",
    author: "Anita Shah",
    event: "50th Birthday Celebration",
    seed: "vivah-testimonial-3",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="section section-alt">
      <h2 className="section-title">What Our Clients Say</h2>
      <p className="section-subtitle">Real stories from real celebrations.</p>
      <div className="grid testimonials-grid">
        {TESTIMONIALS.map((t) => (
          <div className="card testimonial-card" key={t.author}>
            <span className="quote-mark">&ldquo;</span>
            <p className="testimonial-stars">★★★★★</p>
            <p className="quote">{t.quote}</p>
            <div className="testimonial-footer">
              <img
                className="testimonial-avatar"
                src={`https://picsum.photos/seed/${t.seed}/80/80`}
                alt={t.author}
                loading="lazy"
              />
              <p className="testimonial-author">
                {t.author}
                <span>{t.event}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
