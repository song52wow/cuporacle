import { Hero } from "@/components/sections/Hero";
import { StatsBar } from "@/components/sections/StatsBar";
import { UpcomingMatches } from "@/components/sections/UpcomingMatches";
import { Features } from "@/components/sections/Features";
import { CallToAction } from "@/components/sections/CallToAction";

export const runtime = "edge";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <UpcomingMatches />
      <Features />
      <CallToAction />
    </>
  );
}
