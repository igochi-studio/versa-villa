import HeroV2 from "./v2/HeroV2";
import HeaderV2 from "./v2/HeaderV2";
import FeaturesV2 from "./v2/FeaturesV2";
import ContextV2 from "./v2/ContextV2";
import VisionV2 from "./v2/VisionV2";
import HashScroll from "./v2/HashScroll";
import LandscapeSection from "./components/LandscapeSection";

export default function Home() {
  return (
    <main>
      <HashScroll />
      <HeaderV2 />
      <HeroV2 />
      <FeaturesV2 />
      <ContextV2 />
      <VisionV2 />
      <div id="connect" style={{ backgroundColor: "#F8F2E4" }}>
        <LandscapeSection />
      </div>
    </main>
  );
}
