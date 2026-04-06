"use client";

import { usePathname } from "next/navigation";
import { type FC, type PropsWithChildren } from "react";

const Background: FC<PropsWithChildren> = ({ children }) => {
	const pathname = usePathname();

	let backgroundImage;
	switch (pathname) {
		case "/":
			backgroundImage = "/images/Chapter_1_Entrance.webp";
			break;
		case "/login":
		case "/signup":
			backgroundImage = "/images/candle.webp";
			break;
		case "/dashboard":
		case "/cosmetics":
		case pathname.match(/^\/profile\/[^\/]+\/missing$/)?.input: // Matches /profile/:username/missing
		case pathname.match(/^\/compare\/[^\/]+$/)?.input: // Matches /compare/:username
			backgroundImage = "/images/chap1.jpg";
			break;
		case "/search":
		case pathname.match(/^\/profile\/[^\/]+$/)?.input: // Matches /profile/:username
		case "/friends":
		case "/missing-cosmetics":
		case "/leaderboard":
		case "/activity":
		case "/notifications":
			backgroundImage = "/images/house.jpg";
			break;
		case "/puzzles":
		case pathname.match(/^\/puzzles\/.+$/)?.input: // Matches /puzzles/:puzzleId
			backgroundImage = "/images/puzzles.jpg";
			break;
		default:
			backgroundImage = "/images/do_not_enter.png";
			break;
	}

	// For debugging purposes
	// console.log(`Current pathname: ${pathname}`);

	return (
		<div
			className="bg-black/60 bg-blend-overlay bg-cover bg-center bg-no-repeat bg-fixed min-h-screen w-full overflow-auto"
			style={{ backgroundImage: `url('${backgroundImage}')` }}
		>
			{children}
		</div>
	);
};

export default Background;
