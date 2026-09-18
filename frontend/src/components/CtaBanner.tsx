interface CtaBannerProps {
  onPlanEvent: () => void;
}

export function CtaBanner({ onPlanEvent }: CtaBannerProps) {
  return (
    <section className="cta-banner">
      <div className="cta-banner-inner">
        <h2>Ready to Plan Your Dream Event?</h2>
        <p>Tell us your guest count and budget — get an AI-crafted menu and quotation in minutes.</p>
        <button className="btn btn-gold btn-large" onClick={onPlanEvent}>
          Get Started Free
        </button>
      </div>
    </section>
  );
}
