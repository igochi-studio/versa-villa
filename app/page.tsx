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
      <div className="relative z-[2] flex flex-col gap-[100px] md:gap-[200px]" style={{ backgroundColor: "#F8F2E4" }}>
        <DestroyingCosmos />
        <DestroyingSection />
        <div className="relative z-[3] mt-[calc(-100vh-100px)] md:mt-[calc(-100vh-200px)]">
          <SystemSection />
        </div>
        <LandscapeSection />
      </div>
    </main>
  );
}
