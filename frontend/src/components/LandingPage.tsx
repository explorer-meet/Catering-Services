import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Services } from "./Services";
import { WhyChooseUs } from "./WhyChooseUs";
import { Gallery } from "./Gallery";
import { CtaBanner } from "./CtaBanner";
import { Testimonials } from "./Testimonials";
import { Footer } from "./Footer";

interface LandingPageProps {
  onPlanEvent: () => void;
}

export function LandingPage({ onPlanEvent }: LandingPageProps) {
  return (
    <div className="landing">
      <Navbar onPlanEvent={onPlanEvent} />
      <Hero onPlanEvent={onPlanEvent} />
      <Services />
      <WhyChooseUs />
      <Gallery />
      <CtaBanner onPlanEvent={onPlanEvent} />
      <Testimonials />
      <Footer />
    </div>
  );
}
