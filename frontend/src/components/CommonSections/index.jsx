import AboutSection from "../AboutSection";
import ServicesSection from "../ServicesSection";
import ChooseUsSection from "../ChooseUsSection";
import SpecialOffer from "../SpecialOffer/SpecialOffer";

export default function CommonSections({ user }) {
  return (
    <>
      <AboutSection user={user} />
      <SpecialOffer user={user} />
      <ServicesSection user={user} />
      <ChooseUsSection />
    </>
  );
}