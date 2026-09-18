import { useState } from "react";
import { EMPTY_WIZARD_DATA, EVENT_TYPES, MEAL_TYPES, WizardData } from "../wizardData";

interface EventWizardProps {
  onCancel: () => void;
  onSubmit: (data: WizardData) => void;
  submitting: boolean;
}

const TOTAL_STEPS = 6;

export function EventWizard({ onCancel, onSubmit, submitting }: EventWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD_DATA);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleMealType(value: string) {
    setData((d) => ({
      ...d,
      serviceTimes: d.serviceTimes.includes(value)
        ? d.serviceTimes.filter((v) => v !== value)
        : [...d.serviceTimes, value],
    }));
  }

  const canProceed = getStepValidity(step, data);

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else onSubmit(data);
  }

  function back() {
    if (step === 1) onCancel();
    else setStep(step - 1);
  }

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        <div className="wizard-header">
          <h2>Plan Your Event</h2>
          <button className="wizard-close" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="wizard-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`progress-dot ${i + 1 <= step ? "active" : ""}`} />
          ))}
        </div>

        <div className="wizard-body">
          {step === 1 && (
            <StepEventType value={data.eventType} onChange={(v) => update("eventType", v)} />
          )}
          {step === 2 && (
            <StepGuestDetails
              guestCount={data.guestCount}
              paxCount={data.paxCount}
              onGuestCount={(v) => update("guestCount", v)}
              onPaxCount={(v) => update("paxCount", v)}
            />
          )}
          {step === 3 && (
            <StepDateVenue
              eventDate={data.eventDate}
              venueType={data.venueType}
              onDate={(v) => update("eventDate", v)}
              onVenue={(v) => update("venueType", v)}
            />
          )}
          {step === 4 && (
            <StepBudget value={data.budgetPerPlate} onChange={(v) => update("budgetPerPlate", v)} />
          )}
          {step === 5 && <StepMealTypes selected={data.serviceTimes} onToggle={toggleMealType} />}
          {step === 6 && (
            <StepContact
              name={data.customerName}
              phone={data.customerPhone}
              onName={(v) => update("customerName", v)}
              onPhone={(v) => update("customerPhone", v)}
            />
          )}
        </div>

        <div className="wizard-footer">
          <button className="btn btn-outline" onClick={back} disabled={submitting}>
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button className="btn btn-primary" onClick={next} disabled={!canProceed || submitting}>
            {submitting ? "Please wait..." : step === TOTAL_STEPS ? "Get My Menu" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStepValidity(step: number, data: WizardData): boolean {
  switch (step) {
    case 1:
      return !!data.eventType;
    case 2:
      return Number(data.guestCount) > 0 && Number(data.paxCount) > 0;
    case 3:
      return !!data.eventDate && !!data.venueType;
    case 4:
      return Number(data.budgetPerPlate) > 0;
    case 5:
      return data.serviceTimes.length > 0;
    case 6:
      return data.customerName.trim().length > 1 && /^[+]?\d{10,15}$/.test(data.customerPhone.trim());
    default:
      return false;
  }
}

function StepEventType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="wizard-step">
      <h3>What type of event are you planning?</h3>
      <div className="option-grid">
        {EVENT_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`option-card ${value === t.value ? "selected" : ""}`}
            onClick={() => onChange(t.value)}
          >
            <span className="option-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepGuestDetails({
  guestCount,
  paxCount,
  onGuestCount,
  onPaxCount,
}: {
  guestCount: string;
  paxCount: string;
  onGuestCount: (v: string) => void;
  onPaxCount: (v: string) => void;
}) {
  return (
    <div className="wizard-step">
      <h3>How many guests are you expecting?</h3>
      <label className="field-label">Number of Persons</label>
      <input
        type="number"
        min={1}
        placeholder="e.g. 500"
        value={guestCount}
        onChange={(e) => onGuestCount(e.target.value)}
      />
      <label className="field-label">Number of Pax (plates to be served)</label>
      <input
        type="number"
        min={1}
        placeholder="e.g. 550 (including buffer)"
        value={paxCount}
        onChange={(e) => onPaxCount(e.target.value)}
      />
      <p className="field-hint">
        Pax is usually slightly higher than guest count to account for extra servings.
      </p>
    </div>
  );
}

function StepDateVenue({
  eventDate,
  venueType,
  onDate,
  onVenue,
}: {
  eventDate: string;
  venueType: string;
  onDate: (v: string) => void;
  onVenue: (v: "INDOOR" | "OUTDOOR") => void;
}) {
  return (
    <div className="wizard-step">
      <h3>When and where is your event?</h3>
      <label className="field-label">Date of Event</label>
      <input type="date" value={eventDate} onChange={(e) => onDate(e.target.value)} />
      <label className="field-label">Venue Type</label>
      <div className="toggle-group">
        <button
          type="button"
          className={`toggle-btn ${venueType === "INDOOR" ? "selected" : ""}`}
          onClick={() => onVenue("INDOOR")}
        >
          🏛️ Indoor
        </button>
        <button
          type="button"
          className={`toggle-btn ${venueType === "OUTDOOR" ? "selected" : ""}`}
          onClick={() => onVenue("OUTDOOR")}
        >
          🌳 Outdoor
        </button>
      </div>
    </div>
  );
}

function StepBudget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="wizard-step">
      <h3>What's your budget per person?</h3>
      <label className="field-label">Per Person Budget (₹)</label>
      <input
        type="number"
        min={1}
        placeholder="e.g. 1200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="field-hint">We'll recommend menu packages that fit within this budget.</p>
    </div>
  );
}

function StepMealTypes({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="wizard-step">
      <h3>Which meal(s) do you need catered?</h3>
      <div className="chip-grid">
        {MEAL_TYPES.map((m) => (
          <button
            key={m.value}
            type="button"
            className={`chip ${selected.includes(m.value) ? "selected" : ""}`}
            onClick={() => onToggle(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepContact({
  name,
  phone,
  onName,
  onPhone,
}: {
  name: string;
  phone: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
}) {
  return (
    <div className="wizard-step">
      <h3>Almost done! How can we reach you?</h3>
      <label className="field-label">Your Name</label>
      <input placeholder="Full name" value={name} onChange={(e) => onName(e.target.value)} />
      <label className="field-label">Phone Number</label>
      <input placeholder="+91 98765 43210" value={phone} onChange={(e) => onPhone(e.target.value)} />
    </div>
  );
}
