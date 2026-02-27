import Hero from "./components/Hero";
import Header from "./components/Header";
import DestroyingCosmos from "./components/DestroyingCosmos";
import DestroyingSection from "./components/DestroyingSection";
import SystemSection from "./components/SystemSection";
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
        <LandscapeSection />
      </div>
    </main>
  );
}
