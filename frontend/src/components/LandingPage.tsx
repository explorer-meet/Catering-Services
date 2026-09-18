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
}

export function LandingPage({ onPlanEvent }: LandingPageProps) {
  return (
    <div className="landing">
      <Navbar onPlanEvent={onPlanEvent} />
      <Hero onPlanEvent={onPlanEvent} />
      <Marquee />
      <Reveal>
        <Services />
      </Reveal>
      <Reveal>
        <WhyChooseUs />
      </Reveal>
      <Reveal>
        <Gallery />
      </Reveal>
      <CtaBanner onPlanEvent={onPlanEvent} />
      <Reveal>
        <Testimonials />
      </Reveal>
      <Footer />
    </div>
  );
}
