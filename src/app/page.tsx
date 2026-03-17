import Link from "next/link";
import { FaSteam, FaKey, FaLayerGroup, FaPuzzlePiece } from "react-icons/fa6";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import PlayerCount from "../components/PlayerCount";

export default async function Home() {
    const session = await getServerSession(authOptions);

    return (
        <main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center pb-12 relative z-10">
            {/* --- Hero Content --- */}
            <section className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center max-w-5xl mx-auto py-12">
                {/* Top Status Badge */}
                <div className="mb-10 inline-flex items-center gap-3 px-4 sm:px-5 py-1.5 sm:py-2 rounded-sm border border-neutral-800 bg-black/60 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-neutral-300"></span>
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-neutral-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center">
                        Cosmetics Database Up To Date
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-b from-neutral-100 via-neutral-400 to-neutral-800 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] leading-none uppercase">
                    Survive The <br />
                    <span className="text-white bg-none drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] font-serif italic tracking-widest relative inline-block mt-2">
                        Labyrinthine
                    </span>
                </h1>

                {/* Main Tracker Subheading */}
                <p className="max-w-2xl mx-auto text-lg sm:text-xl md:text-2xl text-neutral-200 mb-8 font-medium tracking-wide drop-shadow-md px-4">
                    Track your hard earned cosmetics.{" "}
                    <br className="sm:hidden" />
                    <span className="text-neutral-400 font-bold">
                        Help your friends catch theirs.
                    </span>
                </p>

                {/* Game Description Block */}
                <div className="max-w-3xl mx-auto mb-12 p-6 md:p-8 bg-black/50 border-l-4 border-neutral-600 backdrop-blur-sm shadow-2xl relative overflow-hidden group text-left">
                    <div className="absolute inset-0 bg-linear-to-r from-neutral-800/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <p className="text-sm md:text-base text-neutral-400 leading-relaxed font-light relative z-10">
                        &quot; Labyrinthine is a co-op horror game like no
                        other... Play with 1-4 players online as you solve
                        puzzles, collect items and run from the horrors that lie
                        within. Follow in the footsteps of Joan in the story
                        mode or tackle procedurally generated maps that scale
                        with your level and bring a fresh experience each game..
                        &quot;
                    </p>
                </div>

                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto mb-12">
                    {session ? (
                        <Link
                            href="/dashboard"
                            className="group flex items-center justify-center gap-3 px-8 sm:px-10 py-3 sm:py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base sm:text-lg uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                        >
                            <FaLayerGroup className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="group flex items-center justify-center gap-3 px-8 sm:px-10 py-3 sm:py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base sm:text-lg uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                        >
                            <FaKey className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            Sign In
                        </Link>
                    )}
                    <Link
                        href="/puzzles"
                        className="group flex items-center justify-center gap-3 px-8 sm:px-10 py-3 sm:py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base sm:text-lg uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                    >
                        <FaPuzzlePiece className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        Puzzles
                    </Link>
                </div>
            </section>

            {/* --- Trailer Video Section --- */}
            <section className="w-full max-w-4xl mx-auto px-6 mb-24 flex flex-col items-center">
                <div className="aspect-video w-full rounded-sm border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black relative mb-8">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source
                            src="https://cdn.akamai.steamstatic.com/steam/apps/256962951/movie480_vp9.webm?t=1691679856"
                            type="video/webm"
                        />
                    </video>
                </div>
                <a
                    href="https://store.steampowered.com/app/1302240/Labyrinthine/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0"
                >
                    <FaSteam />
                    Buy on Steam
                </a>

                <PlayerCount />
            </section>
        </main>
    );
}
