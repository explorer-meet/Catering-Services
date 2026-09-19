interface CtaBannerProps {
  onPlanEvent: () => void;
}

export function CtaBanner({ onPlanEvent }: CtaBannerProps) {
  return (
    <section className="cta-banner">
      <div className="cta-banner-inner">
        <p className="cta-eyebrow">Your table starts here</p>
        <h2>Let&apos;s make your next gathering unforgettable.</h2>
        <p>Tell us the shape of your celebration and we&apos;ll help you find the right menu, service, and next step.</p>
        <button className="btn btn-gold btn-large" onClick={onPlanEvent}>
          Get Started Free
        </button>
      </div>
    </section>
  );
}
