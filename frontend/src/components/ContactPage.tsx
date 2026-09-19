import { FormEvent, useState } from "react";
import { createContactEnquiry } from "../api/client";
import { EVENT_TYPES } from "../wizardData";
import { PageIntro, StandaloneLayout } from "./GalleryPage";
import { ContactIcon } from "./ContactIcon";

interface ContactPageProps {
  onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void;
  onPlanEvent: () => void;
}

export function ContactPage({ onNavigate, onPlanEvent }: ContactPageProps) {
  const [form, setForm] = useState({ customerName: "", eventType: "", customerPhone: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createContactEnquiry(form);
      setSubmitted(true);
    } catch {
      setError("We could not submit your enquiry. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StandaloneLayout onNavigate={onNavigate} onPlanEvent={onPlanEvent}>
      <div className="contact-page">
      <PageIntro eyebrow="Let's talk" title="Tell us about your celebration" description="Share a few details and our team will get back to you with the right next step." />
      {submitted ? (
        <div className="contact-success">
          <span className="completion-mark" aria-hidden="true">✓</span>
          <h2>Thank you. We have your enquiry.</h2>
          <p>Our team will contact you shortly to understand the occasion and shape the menu.</p>
          <button className="btn btn-primary" onClick={() => onNavigate("landing")}>Return to home</button>
        </div>
      ) : (
        <div className="contact-layout">
          <aside className="contact-aside">
            <p className="page-eyebrow">A thoughtful start</p>
            <h2>Good food begins with a good conversation.</h2>
            <p>Tell us what you are imagining. We will listen, suggest, and help you shape a celebration that feels like yours.</p>
            <div className="contact-detail"><span className="contact-detail-icon"><ContactIcon name="phone" /></span><div><strong>Call us</strong><a href="tel:+919974700749">+91 99747 00749</a></div></div>
            <div className="contact-detail"><span className="contact-detail-icon"><ContactIcon name="mail" /></span><div><strong>Email us</strong><a href="mailto:vivahevents2012@gmail.com">vivahevents2012@gmail.com</a></div></div>
            <div className="contact-detail"><span className="contact-detail-icon"><ContactIcon name="location" /></span><div><strong>Visit us</strong><span>GF-17, Nakshatra Mall, Nr. Canara Bank, IOC Road, Chandkheda, Ahmedabad-382424, Gujarat</span></div></div>
          </aside>
          <form className="contact-form" onSubmit={submit}>
            <label>Name<input required value={form.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder="Your full name" /></label>
            <label>Event type<select required value={form.eventType} onChange={(event) => update("eventType", event.target.value)}><option value="">Choose an event</option>{EVENT_TYPES.map((eventType) => <option key={eventType.value} value={eventType.value}>{eventType.label}</option>)}</select></label>
            <label>Contact number<input required pattern="[+0-9 ]{10,16}" value={form.customerPhone} onChange={(event) => update("customerPhone", event.target.value)} placeholder="+91 98765 43210" /></label>
            <label className="contact-note">Note<textarea required rows={5} value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Tell us your date, guest count, venue, or anything else we should know" /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-primary btn-large" type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send enquiry"}</button>
          </form>
        </div>
      )}
      <div className="contact-map-wrap">
        <div className="contact-map-heading"><p className="page-eyebrow">Find us</p><h2>Come say hello</h2></div>
        <iframe className="contact-map" title="Vivah Events location" loading="lazy" src="https://www.google.com/maps?q=GF-17%2C%20Nakshatra%20Mall%2C%20IOC%20Road%2C%20Chandkheda%2C%20Ahmedabad%20382424%2C%20Gujarat&output=embed" />
      </div>
      </div>
    </StandaloneLayout>
  );
}
