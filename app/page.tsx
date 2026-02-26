import Hero from "./components/Hero";
import Header from "./components/Header";
import DestroyingCosmos from "./components/DestroyingCosmos";
import DestroyingSection from "./components/DestroyingSection";
import SystemSection from "./components/SystemSection";
import RebuildingSection from "./components/RebuildingSection";
import ConstructionSection from "./components/ConstructionSection";
import ModelsSection from "./components/ModelsSection";
import VisionSection from "./components/VisionSection";
import CelebrateSection from "./components/CelebrateSection";
import LandscapeSection from "./components/LandscapeSection";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "200px", backgroundColor: "#F8F2E4" }}>
        <DestroyingCosmos />
        <DestroyingSection />
        <SystemSection />
        <RebuildingSection />
        <ConstructionSection />
        <ModelsSection />
        <VisionSection />
        <CelebrateSection />
        <LandscapeSection />
      </div>
    </main>
  );
}
