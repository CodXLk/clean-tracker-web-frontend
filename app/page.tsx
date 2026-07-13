import { Navbar } from "@/components/marketing/Navbar";
import { HeroScrollScene } from "@/components/marketing/HeroScrollScene";
import { WhoWeAre } from "@/components/marketing/WhoWeAre";
import { OurServices } from "@/components/marketing/OurServices";
import { IndustriesWeServe } from "@/components/marketing/IndustriesWeServe";
import { WhyChooseUs } from "@/components/marketing/WhyChooseUs";
import { ContactSection } from "@/components/marketing/ContactSection";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroScrollScene />
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
