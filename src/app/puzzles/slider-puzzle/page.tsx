import SliderPuzzle from "@/components/SliderPuzzle";
import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata: Metadata = {
    title: "Slider Puzzle | Labyrinthine Tool",
    description: "Practice the Labyrinthine slider puzzle.",
};

export default function SliderPuzzlePage() {
    return (
        <main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center py-24 relative z-10 px-6">
            <div className="w-full max-w-4xl mb-8 flex justify-start">
                <Link
                    href="/puzzles"
                    className="group flex items-center gap-2 px-4 py-2 rounded-sm bg-neutral-900 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    Back to Puzzles
                </Link>
            </div>
            <div className="max-w-4xl w-full flex flex-col items-center text-center mb-12">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-b from-neutral-100 via-neutral-400 to-neutral-800 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase">
                    Slider Puzzle
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-neutral-400 mb-8 font-medium tracking-wide drop-shadow-md">
                    Practice your puzzle-solving skills for Labyrinthine.
                    Arrange the tiles in numerical order from 1 to 8, with the
                    empty space at the end.
                </p>
            </div>

            <SliderPuzzle />
        </main>
    );
}
