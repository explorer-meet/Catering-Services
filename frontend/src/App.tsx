import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { EventWizard } from "./components/EventWizard";
import { MenuResults } from "./components/MenuResults";
import { createWizardEnquiry, generateMenuPackages } from "./api/client";
import { WizardData } from "./wizardData";
import { GalleryPage } from "./components/GalleryPage";
import { ServicesPage } from "./components/ServicesPage";
import { ContactPage } from "./components/ContactPage";
import { PlannerPage } from "./components/PlannerPage";

type View = "landing" | "gallery" | "services" | "contact" | "wizard" | "results";

export function App() {
  const [view, setView] = useState<View>("landing");
  const [submitting, setSubmitting] = useState(false);
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  function navigate(nextView: View) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      setWhatsappLink(enquiry.whatsappLink ?? null);
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
        whatsappLink={whatsappLink}
        guestCount={guestCount}
        packages={packages}
        onBack={() => setView("landing")}
      />
    );
  }

  if (view === "wizard") {
    return (
      <PlannerPage
        onNavigate={navigate}
        onCancel={() => navigate("landing")}
        onSubmit={handleWizardSubmit}
        submitting={submitting}
      />
    );
  }

  if (view === "gallery") return <GalleryPage onNavigate={navigate} onPlanEvent={() => navigate("wizard")} />;
  if (view === "services") return <ServicesPage onNavigate={navigate} onPlanEvent={() => navigate("wizard")} />;
  if (view === "contact") return <ContactPage onNavigate={navigate} onPlanEvent={() => navigate("wizard")} />;

  return (
    <>
      <LandingPage
        onPlanEvent={() => navigate("wizard")}
        onNavigate={navigate}
      />
      {error && (
        <div className="toast-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </>
  );
}

