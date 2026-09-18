import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { EventWizard } from "./components/EventWizard";
import { MenuResults } from "./components/MenuResults";
import { createWizardEnquiry, generateMenuPackages } from "./api/client";
import { WizardData } from "./wizardData";

type View = "landing" | "wizard" | "results";

export function App() {
  const [view, setView] = useState<View>("landing");
  const [submitting, setSubmitting] = useState(false);
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleWizardSubmit(data: WizardData) {
    setSubmitting(true);
    setError(null);
    try {
      const enquiry = await createWizardEnquiry({
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        eventType: data.eventType,
        guestCount: Number(data.guestCount),
        paxCount: Number(data.paxCount),
        eventDate: data.eventDate,
        venueType: data.venueType as "INDOOR" | "OUTDOOR",
        budgetPerPlate: Number(data.budgetPerPlate),
        serviceTimes: data.serviceTimes,
      });
      const generatedPackages = await generateMenuPackages(enquiry.id);
      setEnquiryId(enquiry.id);
      setGuestCount(Number(data.guestCount));
      setPackages(generatedPackages);
      setView("results");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while generating your menu. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "results" && enquiryId) {
    return (
      <MenuResults
        enquiryId={enquiryId}
        guestCount={guestCount}
        packages={packages}
        onBack={() => setView("landing")}
      />
    );
  }

  return (
    <>
      <LandingPage onPlanEvent={() => setView("wizard")} />
      {view === "wizard" && (
        <EventWizard
          onCancel={() => setView("landing")}
          onSubmit={handleWizardSubmit}
          submitting={submitting}
        />
      )}
      {error && (
        <div className="toast-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </>
  );
}

