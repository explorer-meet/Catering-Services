import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Services } from "./Services";
import { WhyChooseUs } from "./WhyChooseUs";
import { Gallery } from "./Gallery";
import { CtaBanner } from "./CtaBanner";
import { Testimonials } from "./Testimonials";
import { Footer } from "./Footer";
import { Reveal } from "./Reveal";

interface LandingPageProps {
  onPlanEvent: () => void;
  onNavigate: (view: "landing" | "gallery" | "services" | "contact") => void;
}

export function LandingPage({ onPlanEvent, onNavigate }: LandingPageProps) {
  return (
    <div id="top" className="landing">
      <Navbar onPlanEvent={onPlanEvent} onNavigate={onNavigate} />
      <Hero onPlanEvent={onPlanEvent} onViewServices={() => onNavigate("services")} />
      <Marquee />
      <Reveal>
        <Services />
      </Reveal>
      <Reveal>
        <WhyChooseUs />
      </Reveal>
      <Reveal>
        <Gallery onViewGallery={() => onNavigate("gallery")} />
      </Reveal>
      <CtaBanner onPlanEvent={onPlanEvent} />
      <Reveal>
        <Testimonials />
      </Reveal>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
