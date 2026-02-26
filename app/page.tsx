import Hero from "./components/Hero";
import Header from "./components/Header";
import DestroyingCosmos from "./components/DestroyingCosmos";
import DestroyingSection from "./components/DestroyingSection";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <div style={{ position: "relative", zIndex: 2 }}>
        <DestroyingCosmos />
        <DestroyingSection />
      </div>
    </main>
  );
}
