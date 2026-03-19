"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaTrophy, FaArrowLeft, FaMedal } from "react-icons/fa6";
import { useApi } from "../../hooks/useApi";

interface LeaderboardEntry {
    id: string;
    username: string;
    profilePictureId: string | null;
    cosmeticsCount: number;
}

export default function LeaderboardPage() {
    const { data, loading, error, execute } = useApi<LeaderboardEntry[]>();
    const leaderboard = data || [];

    useEffect(() => {
        execute("/api/leaderboard").catch(() => {});
    }, [execute]);

    const getRankColor = (index: number) => {
        switch (index) {
            case 0:
                return "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]";
            case 1:
                return "text-neutral-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]";
            case 2:
                return "text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]";
            default:
                return "text-neutral-500";
        }
    };

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-4xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
                <div className="mb-8 text-center border-b border-neutral-800/80 pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaTrophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2">
                        Top Collectors
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium tracking-wide">
                        The most dedicated survivors in the fog, ranked by their
                        wardrobe size.
                    </p>
                </div>

                <div className="flex-1 min-h-[50vh]">
                    {loading && (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-20">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-neutral-300"></span>
                            </span>
                            <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                                Compiling ranks...
                            </span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="w-full text-center py-10 text-red-500 text-sm font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    {!loading && !error && leaderboard.length === 0 && (
                        <div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm">
                            <p className="text-neutral-500 font-medium italic">
                                The leaderboard is currently empty.
                            </p>
                        </div>
                    )}

                    {!loading && leaderboard.length > 0 && (
                        <div className="flex flex-col space-y-3">
                            {leaderboard.map((user, index) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${user.username}`}
                                    className="group relative flex items-center gap-4 p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800 hover:border-neutral-500 transition-all duration-300"
                                >
                                    {/* Rank Indicator */}
                                    <div className="flex flex-col items-center justify-center w-8 shrink-0">
                                        {index < 3 && (
                                            <FaMedal
                                                className={`w-6 h-6 mb-1 ${getRankColor(index)}`}
                                            />
                                        )}
                                        <span
                                            className={`text-xl font-black ${index < 3 ? getRankColor(index) : "text-neutral-600"}`}
                                        >
                                            #{index + 1}
                                        </span>
                                    </div>

                                    {/* Profile Picture */}
                                    <div className="relative w-12 h-12 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
                                        <Image
                                            src={
                                                user.profilePictureId
                                                    ? `/images/profile_pictures/${user.profilePictureId}.webp`
                                                    : `/images/profile_pictures/1.webp`
                                            }
                                            alt={user.username}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            sizes="48px"
                                        />
                                    </div>

                                    {/* User Info */}
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-neutral-200 font-bold text-lg truncate group-hover:text-white transition-colors">
                                            {user.username}
                                        </span>
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mt-0.5 group-hover:text-neutral-400 transition-colors">
                                            View Profile &rarr;
                                        </span>
                                    </div>

                                    {/* Score */}
                                    <div className="flex flex-col items-end shrink-0 pl-4 border-l border-neutral-800/80">
                                        <span className="text-2xl font-black text-emerald-500 leading-none group-hover:text-emerald-400 transition-colors">
                                            {user.cosmeticsCount}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mt-1">
                                            Unlocked
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 border-t border-neutral-800/80 pt-6">
                    <Link
                        href="/dashboard"
                        className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2"
                    >
                        <FaArrowLeft /> Return to Safehouse
                    </Link>
                </div>
            </div>
        </main>
    );
}
