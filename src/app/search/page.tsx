"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useDebounce } from "use-debounce";
import { useApi } from "../../hooks/useApi";

interface UserResult {
	id: string;
	username: string;
	profilePictureId: string | null;
	isAdministrator: boolean;
}

export default function SearchPage() {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const { data, loading, error, execute, setData: setResults } = useApi<UserResult[]>();
	const results = data || [];

	// Debounce the search query so we don't spam the API on every keystroke
	const [debouncedQuery] = useDebounce(searchQuery, 400);

	useEffect(() => {
		if (!debouncedQuery.trim() || debouncedQuery.trim().length < 3) {
			setResults([]);
			return;
		}

		execute(`/api/search?q=${encodeURIComponent(debouncedQuery)}`).catch(() => {
			setResults([]);
		});
	}, [debouncedQuery, execute, setResults]);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-3xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2"
					>
						&larr; Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 text-center sm:text-left border-b border-neutral-800/80 pb-6">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2">
						Find Survivors
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Search the fog for other players and view their cosmetic collections.
					</p>
				</div>

				<div className="relative mb-8">
					<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<FaMagnifyingGlass className="text-neutral-500 w-5 h-5" />
					</div>
					<input
						type="text"
						placeholder="Type a username..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-neutral-900/50 border-2 border-neutral-800 text-neutral-100 pl-12 pr-4 py-4 rounded-sm focus:outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-all font-medium tracking-wide placeholder:text-neutral-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
						autoFocus
					/>
				</div>

				<div className="flex-1 min-h-75">
					{loading && (
						<div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-12">
							<span className="relative flex h-4 w-4">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-4 w-4 bg-neutral-300"></span>
							</span>
							<span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
								Scanning the maze...
							</span>
						</div>
					)}

					{error && !loading && (
						<div className="w-full text-center py-10 text-red-500 text-sm font-bold uppercase tracking-widest">
							{error}
						</div>
					)}

					{!loading && !error && results.length === 0 && debouncedQuery && (
						<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm">
							<p className="text-neutral-500 font-medium italic">
								No survivors found matching &quot;
								{debouncedQuery}&quot;.
							</p>
						</div>
					)}

					{!loading && results.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{results.map((user) => (
								<Link
									key={user.id}
									href={`/profile/${user.username}`}
									className="group flex items-center gap-4 p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800 hover:border-neutral-500 transition-all duration-300"
								>
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
											sizes="200px"
										/>
									</div>
									<div className="flex flex-col min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-neutral-200 font-bold truncate group-hover:text-white transition-colors">
												{user.username}
											</span>
											{user.isAdministrator && (
												<span className="px-1.5 py-0.5 bg-red-950/50 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-900/50 rounded-sm shrink-0">
													Admin
												</span>
											)}
										</div>
										<span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mt-0.5 group-hover:text-neutral-400 transition-colors">
											View Profile &rarr;
										</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
