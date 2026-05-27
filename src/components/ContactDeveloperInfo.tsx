import { DISCORD_DEVELOPER_ADD_FRIEND_URL } from "@/constants/discord";
import { FaDiscord } from "react-icons/fa6";

export default function ContactDeveloperInfo() {
	return (
		<div className="w-full mt-6 rounded-2xl border border-neutral-800 bg-black/40 px-5 py-4 sm:px-6 sm:py-5 text-center sm:text-left">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
						Need help or have ideas?
					</p>
					<p className="text-sm sm:text-base text-neutral-300 mt-2">
						Report issues or share suggestions with the developer on Discord.
					</p>
				</div>
				<a
					href={DISCORD_DEVELOPER_ADD_FRIEND_URL}
					className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/70 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-neutral-200 hover:bg-neutral-900/90 hover:scale-105 transition-all duration-200"
					target="_blank"
					rel="noopener noreferrer"
				>
					<FaDiscord className="text-[#5865F2]" />
					<span>25gold25</span>
				</a>
			</div>
		</div>
	);
}
