import FaqSection from "../components/home/FaqSection";
import DiscordCommunitySection from "../components/home/DiscordCommunitySection";
import FeatureHighlightsSection from "../components/home/FeatureHighlightsSection";
import FinalCtaSection from "../components/home/FinalCtaSection";
import HeroSection from "../components/home/HeroSection";
import ProgressLoopSection from "../components/home/ProgressLoopSection";
import SteamChangelogSection from "../components/home/SteamChangelogSection";
import TrailerSection from "../components/home/TrailerSection";
import WikiGuideSection from "../components/home/WikiGuideSection";
import { getValidatedServerSession } from "../lib/session-user";

export default async function Home() {
	const session = await getValidatedServerSession();
	const isAuthenticated = Boolean(session);

	return (
		<main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center pb-16 sm:pb-20 relative z-10">
			<HeroSection isAuthenticated={isAuthenticated} />
			<TrailerSection />
			<DiscordCommunitySection />
			<FeatureHighlightsSection />
			<ProgressLoopSection />
			<WikiGuideSection />
			<SteamChangelogSection />
			<FaqSection />
			<FinalCtaSection isAuthenticated={isAuthenticated} />
		</main>
	);
}
