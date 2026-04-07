import { getServerSession } from "next-auth";
import FaqSection from "../components/home/FaqSection";
import FeatureHighlightsSection from "../components/home/FeatureHighlightsSection";
import FinalCtaSection from "../components/home/FinalCtaSection";
import HeroSection from "../components/home/HeroSection";
import ProgressLoopSection from "../components/home/ProgressLoopSection";
import TrailerSection from "../components/home/TrailerSection";
import { authOptions } from "../lib/auth";

export default async function Home() {
	const session = await getServerSession(authOptions);
	const isAuthenticated = Boolean(session);

	return (
		<main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center pb-12 relative z-10">
			<HeroSection isAuthenticated={isAuthenticated} />
			<TrailerSection />
			<FeatureHighlightsSection />
			<ProgressLoopSection />
			<FaqSection />
			<FinalCtaSection isAuthenticated={isAuthenticated} />
		</main>
	);
}
