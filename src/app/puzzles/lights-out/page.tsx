import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";
import LightsOut from "../../../components/LightsOut";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Lights Out | Labyrinthine Tool",
	description: "Practice the Labyrinthine Lights Out puzzle.",
};

export default function LightsOutPage() {
	return (
		<main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center pt-24 pb-12 px-6 relative z-10">
			<div className="max-w-4xl w-full flex flex-col items-center text-center gap-12">
				<div className="w-full flex justify-start -mb-8">
					<Link
						href="/puzzles"
						className="group flex items-center gap-2 px-4 py-2 rounded-sm bg-neutral-900 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300"
					>
						<FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
						Back to Puzzles
					</Link>
				</div>

				<h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-b from-neutral-100 via-neutral-400 to-neutral-800 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase">
					Lights Out
				</h1>

				<div className="w-full max-w-2xl mx-auto flex justify-center">
					<LightsOut />
				</div>
			</div>
		</main>
	);
}
