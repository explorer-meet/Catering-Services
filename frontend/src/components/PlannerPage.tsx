import { EventWizard } from "./EventWizard";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { WizardData } from "../wizardData";

interface PlannerPageProps {
  onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void;
  onCancel: () => void;
  onSubmit: (data: WizardData) => void;
  submitting: boolean;
}

export function PlannerPage({ onNavigate, onCancel, onSubmit, submitting }: PlannerPageProps) {
  return (
    <div className="planner-page">
      <Navbar onPlanEvent={() => window.scrollTo({ top: 0, behavior: "smooth" })} onNavigate={onNavigate} />
      <main>
        <EventWizard onCancel={onCancel} onSubmit={onSubmit} submitting={submitting} />
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
