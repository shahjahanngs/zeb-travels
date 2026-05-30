import React, { useState, useEffect } from "react";
import HeroSection from "../../../components/HeroSection";
import CommonSections from "../../../components/CommonSections";
import SpecialOfferModal from "../../../components/SpecialOfferModal";

export default function Home({ user, onLogin }) {
  const [showPopup, setShowPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  useEffect(() => {
    if (user && !hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        setHasSeenPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!user) setHasSeenPopup(false);
  }, [user, hasSeenPopup]);

  return (
    <>
      <HeroSection onLogin={onLogin} user={user} />
      <CommonSections user={user} />
      <SpecialOfferModal isOpen={showPopup} onClose={() => setShowPopup(false)} />
    </>
  );
}