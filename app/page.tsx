import { Navbar } from "@/components/marketing/Navbar";
import { HeroScene } from "@/components/marketing/HeroScene";
import { WhoWeAre } from "@/components/marketing/WhoWeAre";
import { OurServices } from "@/components/marketing/OurServices";
import { IndustriesWeServe } from "@/components/marketing/IndustriesWeServe";
import { WhyChooseUs } from "@/components/marketing/WhyChooseUs";
import { ContactSection } from "@/components/marketing/ContactSection";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      {/* Every scene after the hero sits on the same hazy sky. Figma achieves it
          by zooming the skyline plate far out; a fixed gradient reproduces the
          sampled endpoints (#8EAAB1 -> #9FAFB2) at a fraction of the cost, and
          being fixed it reads identically in each viewport-sized scene. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,var(--color-atmos-top),var(--color-atmos-bottom))]"
      />
      <Navbar />
      <main>
        <HeroScene />
        <WhoWeAre />
        <OurServices />
        <IndustriesWeServe />
        <WhyChooseUs />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
