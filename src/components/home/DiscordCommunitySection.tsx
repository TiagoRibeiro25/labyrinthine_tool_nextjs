import Link from "next/link";
import { FaDiscord } from "react-icons/fa";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { VALKO_DISCORD_INVITE_URL } from "../../constants/discord";
import { getValkoDiscordInviteStats } from "../../lib/discord-invite";

export default async function DiscordCommunitySection() {
	const stats = await getValkoDiscordInviteStats();

	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
					<div>
						<span className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
							<FaDiscord className="h-3.5 w-3.5 text-[#7b86ff]" />
							Official Community
						</span>

						<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-neutral-100">
							Join Valko on Discord
						</h2>

						<p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
							{stats?.description ??
								"Connect with the Labyrinthine community, find cosmetic trades, squad up for events, and stay close to the dev team."}
						</p>

						<Link
							href={VALKO_DISCORD_INVITE_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="group mt-7 inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-[#5865f2]/60 bg-[#5865f2]/20 px-7 py-3.5 text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-[#7b86ff] hover:bg-[#5865f2]/35 hover:shadow-[0_0_30px_rgba(88,101,242,0.25)]"
						>
							<FaDiscord className="h-5 w-5 text-[#7b86ff] transition-transform group-hover:scale-110" />
							Join the Server
							<FaArrowUpRightFromSquare className="h-3.5 w-3.5 opacity-70" />
						</Link>
					</div>

					{stats ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<article className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
								<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
									Members
								</p>
								<p className="mt-2 text-3xl sm:text-4xl font-black text-neutral-100">
									{stats.memberCount.toLocaleString()}
								</p>
								<p className="mt-2 text-sm text-neutral-400">
									Players in {stats.guildName}
								</p>
							</article>

							<article className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
								<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
									Online Now
								</p>
								<p className="mt-2 text-3xl sm:text-4xl font-black text-emerald-300">
									{stats.onlineCount.toLocaleString()}
								</p>
								<p className="mt-2 text-sm text-neutral-400">Active in voice and chat</p>
							</article>
						</div>
					) : (
						<div className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
							<p className="text-sm text-neutral-400 leading-relaxed">
								Live member counts are unavailable right now, but you can still join the
								official Valko Game Studios server anytime.
							</p>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
