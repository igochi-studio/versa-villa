import Hero from "./components/Hero";
import DestroyingSection from "./components/DestroyingSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <div style={{ position: "relative", zIndex: 2 }}>
        <DestroyingSection />
      </div>
    </main>
  );
}
