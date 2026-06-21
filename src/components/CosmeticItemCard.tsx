import Image from "next/image";
import Link from "next/link";
import { FaLock, FaMagnifyingGlass } from "react-icons/fa6";
import type { CosmeticItem } from "../lib/cosmetics";

interface CosmeticItemCardProps {
	item: CosmeticItem;
	keyPrefix: string;
	cardClasses: string;
	bannerClasses: string;
	badgeIcon: React.ReactNode;
	grayscale?: boolean;
}

export default function CosmeticItemCard({
	item,
	keyPrefix,
	cardClasses,
	bannerClasses,
	badgeIcon,
	grayscale = false,
}: CosmeticItemCardProps) {
	return (
		<div
			key={`${keyPrefix}-${item.id}`}
			className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${cardClasses}`}
		>
			<div className={`absolute inset-x-0 top-0 h-1 ${bannerClasses}`} />

			<Link
				href={`/missing-cosmetics?cosmeticId=${item.id}`}
				title="Find friends missing this"
				className="absolute left-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300 transition-colors md:opacity-0 md:group-hover:opacity-100 hover:border-emerald-300 hover:text-emerald-200"
			>
				<FaMagnifyingGlass className="w-3 h-3" />
			</Link>

			<div className="absolute right-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300">
				{badgeIcon}
			</div>

			<div className="relative aspect-square w-full shrink-0 bg-neutral-950/70 p-4">
				<div
					className={`relative h-full w-full transition-all duration-500 ${
						grayscale
							? "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
							: "drop-shadow-[0_0_14px_rgba(186,230,253,0.45)] group-hover:scale-110"
					}`}
				>
					<Image
						src={`/images/cosmetics/${item.id}.png`}
						alt={item.name}
						fill
						className="object-contain"
						sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
						loading="lazy"
					/>
				</div>
			</div>

			<div className="mt-auto flex min-h-21 items-center justify-center border-t border-neutral-800/70 bg-neutral-900/80 px-3 py-3">
				<p className="line-clamp-2 min-h-9 text-center text-[11px] sm:text-xs uppercase tracking-[0.13em] font-semibold leading-relaxed text-neutral-200">
					{item.name}
				</p>
			</div>
		</div>
	);
}
