import { Hero } from "@/components/sections/Hero";
import { StatsBar } from "@/components/sections/StatsBar";
import { UpcomingMatches } from "@/components/sections/UpcomingMatches";
import { Features } from "@/components/sections/Features";
import { CallToAction } from "@/components/sections/CallToAction";

// Cloudflare Pages / Workers 要求显式声明 Edge Runtime
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
