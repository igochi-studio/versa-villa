import Hero from "./components/Hero";
import DestroyingSection from "./components/DestroyingSection";
import AmbitionSection from "./components/AmbitionSection";
import SystemSection from "./components/SystemSection";
import RebuildingSection from "./components/RebuildingSection";
import ConstructionSection from "./components/ConstructionSection";
import ModelsSection from "./components/ModelsSection";
import VisionSection from "./components/VisionSection";
import CelebrateSection from "./components/CelebrateSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <div style={{ position: "relative", zIndex: 2 }}>
        <DestroyingSection />
        <AmbitionSection />
        <SystemSection />
        <RebuildingSection />
        <ConstructionSection />
        <ModelsSection />
        <VisionSection />
        <CelebrateSection />
      </div>
    </main>
  );
}
