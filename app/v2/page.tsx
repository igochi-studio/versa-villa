import HeroV2 from "./HeroV2";
import HeaderV2 from "./HeaderV2";
import AsSeenOn from "./AsSeenOn";
import SystemSection from "../components/SystemSection";
import LandscapeSection from "../components/LandscapeSection";

export default function HomeV2() {
  return (
    <main>
      <HeaderV2 />
      <HeroV2 />
      <AsSeenOn />
      <div style={{ backgroundColor: "#F8F2E4" }}>
        <SystemSection />
        <LandscapeSection />
      </div>
    </main>
  );
}
