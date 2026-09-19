import { useEffect, useState } from "react";

const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/Wydh5zweji2T5WnG6";

const REVIEWS = [
  {
    quote: "From welcome drinks to the dessert buffet, every dish was delicious. Our guests were gushing about the food for days!",
    author: "Yash Mehta",
  },
  {
    quote: "Two years later, people still tell me the food at my wedding was the best wedding food they ever had. Highly recommended.",
    author: "Anushree Rao",
  },
  {
    quote: "We hired them for a corporate event with 300 guests. On-time setup, hot, hygienic and very tasty. Complimentary feedback from the entire office.",
    author: "Rohit Desai",
  },
  {
    quote: "The presentation was beautiful and the team handled every detail so smoothly. Our family truly enjoyed the entire experience.",
    author: "Neha Patel",
  },
  {
    quote: "Excellent hospitality, delicious food, and a very professional team. Vivah Events made our celebration feel effortless.",
    author: "Amit Shah",
  },
];

const VISIBLE_REVIEW_COUNT = 3;
const ROTATION_COUNT = REVIEWS.length - VISIBLE_REVIEW_COUNT + 1;

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % ROTATION_COUNT);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="testimonials" className="section section-alt testimonials-section">
      <div className="testimonials-heading">
        <p className="page-eyebrow">Google Reviews</p>
        <h2 className="section-title">Loved by celebrations across Ahmedabad</h2>
        <p className="section-subtitle">Real voices. Real celebrations. Shared by our Google reviewers.</p>
      </div>

      <div className="reviews-carousel" aria-live="polite">
        <div className="reviews-track" style={{ transform: `translateX(-${activeIndex * 20}%)` }}>
          {REVIEWS.map((review) => (
            <article className="google-review-card" key={review.author}>
              <div className="google-review-card-top">
                <span className="google-stars" aria-label="5 out of 5 stars">★★★★★</span>
                <span className="google-source">VIA GOOGLE</span>
              </div>
              <p className="google-review-quote-text">&quot;{review.quote}&quot;</p>
              <div className="google-review-author">
                <span className="reviewer-initial">{review.author[0]}</span>
                <span><strong>{review.author}</strong><small>Google Reviewer</small></span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="review-controls">
        <button className="review-arrow" onClick={() => setActiveIndex((activeIndex + ROTATION_COUNT - 1) % ROTATION_COUNT)} aria-label="Previous review">←</button>
        <div className="review-dots">
          {Array.from({ length: ROTATION_COUNT }).map((_, index) => <button key={index} className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show review group ${index + 1}`} />)}
        </div>
        <button className="review-arrow" onClick={() => setActiveIndex((activeIndex + 1) % ROTATION_COUNT)} aria-label="Next review">→</button>
      </div>

      <a className="btn btn-primary google-reviews-cta" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noreferrer">
        ★ <span>Read all reviews on Google</span>
      </a>
    </section>
  );
}
