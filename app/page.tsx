import { Navbar } from "@/components/marketing/Navbar";
import { HeroScene } from "@/components/marketing/HeroScene";
import { WhoWeAre } from "@/components/marketing/WhoWeAre";
import { OurServices } from "@/components/marketing/OurServices";
import { IndustriesWeServe } from "@/components/marketing/IndustriesWeServe";
import { TowerBackdrop } from "@/components/marketing/TowerBackdrop";
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
        {/* Industries and Why Choose Us share one tower. It is mounted around
            the pair so a single sticky element can carry the camera across both
            — each scene owning a copy left the building split in two at the
            handover, one half sliding while the other stood still. */}
        <div className="relative">
          <TowerBackdrop />
          <IndustriesWeServe />
          <WhyChooseUs />
        </div>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
