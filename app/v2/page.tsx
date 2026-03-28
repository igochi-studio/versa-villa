import HeroV2 from "./HeroV2";
import HeaderV2 from "./HeaderV2";
import FeaturesV2 from "./FeaturesV2";
import ContextV2 from "./ContextV2";
import VisionV2 from "./VisionV2";
import HashScroll from "./HashScroll";
import LandscapeSection from "../components/LandscapeSection";

export default function HomeV2() {
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
