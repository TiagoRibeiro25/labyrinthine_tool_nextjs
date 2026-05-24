import Link from "next/link";
import { FaArrowUpRightFromSquare, FaSteam } from "react-icons/fa6";
import { LABYRINTHINE_STEAM_NEWS_URL } from "../../constants/steam";
import { getLabyrinthineSteamNews } from "../../lib/steam-news";

const NEWS_COUNT = 6;

function formatNewsDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default async function SteamChangelogSection() {
	const items = await getLabyrinthineSteamNews(NEWS_COUNT);

	if (items.length === 0) {
		return null;
	}

	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="mb-8 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<span className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
							<FaSteam className="h-3.5 w-3.5" />
							Steam Updates
						</span>
						<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-neutral-100">
							Latest Changelogs
						</h2>
						<p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-400">
							Recent patch notes and announcements from the official Labyrinthine Steam
							community feed.
						</p>
					</div>

					<Link
						href={LABYRINTHINE_STEAM_NEWS_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-neutral-700 bg-black/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-200 transition-all duration-300 hover:border-neutral-500 hover:bg-neutral-900"
					>
						View All on Steam
						<FaArrowUpRightFromSquare className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
					</Link>
				</div>

				<div className="space-y-4">
					{items.map((item) => (
						<article
							key={item.id}
							className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6 transition-colors duration-300 hover:border-neutral-600"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0">
									<h3 className="text-lg sm:text-xl font-black tracking-wide uppercase text-neutral-100">
										{item.title}
									</h3>
									<p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
										{formatNewsDate(item.date)}
										{item.author ? ` · ${item.author}` : ""}
										{item.feedLabel ? ` · ${item.feedLabel}` : ""}
									</p>
								</div>

								<Link
									href={item.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 transition-colors hover:text-neutral-200"
								>
									Read on Steam
									<FaArrowUpRightFromSquare className="h-3 w-3" />
								</Link>
							</div>

							{item.contents ? (
								<pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-neutral-300 leading-relaxed line-clamp-6">
									{item.contents}
								</pre>
							) : null}
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
