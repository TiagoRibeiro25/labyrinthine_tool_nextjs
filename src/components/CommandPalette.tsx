"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	FaArrowRight,
	FaCompass,
	FaDoorOpen,
	FaMagnifyingGlass,
	FaShield,
	FaShirt,
	FaTrophy,
	FaUserGroup,
	FaWandMagicSparkles,
} from "react-icons/fa6";
import { useDebounce } from "use-debounce";
import { useApi } from "../hooks/useApi";

interface UserSearchResult {
	id: string;
	username: string;
	profilePictureId: string | null;
	isAdministrator: boolean;
}

interface CommandItem {
	id: string;
	label: string;
	description: string;
	href: string;
	keywords: string[];
}

type PaletteItem =
	| {
			type: "command";
			id: string;
			label: string;
			description: string;
			href: string;
	  }
	| {
			type: "user";
			id: string;
			username: string;
			href: string;
			isAdministrator: boolean;
	  };

const COMMANDS: CommandItem[] = [
	{
		id: "home",
		label: "Go to Home",
		description: "Landing page",
		href: "/",
		keywords: ["home", "landing", "start"],
	},
	{
		id: "dashboard",
		label: "Open Dashboard",
		description: "Your safehouse overview",
		href: "/dashboard",
		keywords: ["dashboard", "safehouse", "overview"],
	},
	{
		id: "cosmetics",
		label: "Open Wardrobe",
		description: "Track and manage cosmetics",
		href: "/cosmetics",
		keywords: ["cosmetics", "wardrobe", "tracker", "collection"],
	},
	{
		id: "friends",
		label: "Open Connections",
		description: "Friends and requests",
		href: "/friends",
		keywords: ["friends", "connections", "requests"],
	},
	{
		id: "search",
		label: "Find Survivors",
		description: "Search player profiles",
		href: "/search",
		keywords: ["search", "survivors", "players", "profiles"],
	},
	{
		id: "missing",
		label: "Missing Cosmetics",
		description: "Find friends missing an item",
		href: "/missing-cosmetics",
		keywords: ["missing", "cosmetics", "friends", "hunt"],
	},
	{
		id: "leaderboard",
		label: "Top Collectors",
		description: "View leaderboard rankings",
		href: "/leaderboard",
		keywords: ["leaderboard", "top", "ranking", "collectors"],
	},
	{
		id: "activity",
		label: "Friend Activity",
		description: "Recent friend unlocks and puzzle runs",
		href: "/activity",
		keywords: ["activity", "feed", "friends", "updates"],
	},
	{
		id: "notifications",
		label: "Notifications Center",
		description: "View unread alerts and updates",
		href: "/notifications",
		keywords: ["notifications", "alerts", "inbox"],
	},
	{
		id: "puzzles",
		label: "Open Puzzles",
		description: "Practice puzzle challenges",
		href: "/puzzles",
		keywords: ["puzzles", "lights out", "slider"],
	},
	{
		id: "puzzle-leaderboards",
		label: "Puzzle Leaderboards",
		description: "Global puzzle rankings",
		href: "/puzzles/leaderboard",
		keywords: ["puzzles", "leaderboard", "ranks", "global"],
	},
	{
		id: "admin",
		label: "Admin Panel",
		description: "Maintenance and operational tools",
		href: "/admin",
		keywords: ["admin", "maintenance", "cleanup", "ops"],
	},
	{
		id: "login",
		label: "Sign In",
		description: "Open login page",
		href: "/login",
		keywords: ["login", "signin", "auth"],
	},
	{
		id: "signup",
		label: "Create Account",
		description: "Open signup page",
		href: "/signup",
		keywords: ["signup", "register", "account"],
	},
];

export default function CommandPalette() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [query, setQuery] = useState<string>("");
	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	const [users, setUsers] = useState<UserSearchResult[]>([]);
	const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);
	const { execute: executeSearch } = useApi<UserSearchResult[]>();

	const [debouncedQuery] = useDebounce(query.trim(), 250);

	const openPalette = useCallback(() => {
		setIsOpen(true);
	}, []);

	const closePalette = useCallback(() => {
		setIsOpen(false);
		setQuery("");
		setUsers([]);
		setSelectedIndex(0);
	}, []);

	const navigateTo = useCallback(
		(href: string) => {
			closePalette();
			router.push(href);
		},
		[closePalette, router]
	);

	const filteredCommands = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) {
			return COMMANDS.slice(0, 8);
		}

		return COMMANDS.filter((command) => {
			const haystack = [
				command.label,
				command.description,
				command.href,
				...command.keywords,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(q);
		}).slice(0, 8);
	}, [query]);

	useEffect(() => {
		if (!isOpen) return;
		if (debouncedQuery.length < 2) {
			setUsers([]);
			setIsSearchingUsers(false);
			return;
		}

		const controller = new AbortController();

		const run = async () => {
			setIsSearchingUsers(true);
			try {
				const data = await executeSearch(
					`/api/search?q=${encodeURIComponent(debouncedQuery)}`,
					{
						method: "GET",
						signal: controller.signal,
					}
				);
				setUsers(Array.isArray(data) ? data.slice(0, 6) : []);
			} catch {
				setUsers([]);
			} finally {
				setIsSearchingUsers(false);
			}
		};

		void run();

		// If the user types a new character or closes the palette, abort the ongoing request
		return () => controller.abort();
	}, [debouncedQuery, executeSearch, isOpen]);

	const items = useMemo<PaletteItem[]>(() => {
		const commandItems: PaletteItem[] = filteredCommands.map((command) => ({
			type: "command",
			id: `command-${command.id}`,
			label: command.label,
			description: command.description,
			href: command.href,
		}));

		const userItems: PaletteItem[] = users.map((user) => ({
			type: "user",
			id: `user-${user.id}`,
			username: user.username,
			href: `/profile/${encodeURIComponent(user.username)}`,
			isAdministrator: user.isAdministrator,
		}));

		return [...commandItems, ...userItems];
	}, [filteredCommands, users]);

	useEffect(() => {
		if (!isOpen) return;
		if (items.length === 0) {
			setSelectedIndex(0);
			return;
		}

		setSelectedIndex((prev) => {
			if (prev < 0) return 0;
			if (prev >= items.length) return items.length - 1;
			return prev;
		});
	}, [isOpen, items]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const isHotkey =
				(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

			if (isHotkey) {
				event.preventDefault();
				setIsOpen((prev) => !prev);
				return;
			}

			if (!isOpen) return;

			if (event.key === "Escape") {
				event.preventDefault();
				closePalette();
				return;
			}

			if (items.length === 0) return;

			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % items.length);
				return;
			}

			if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
				return;
			}

			if (event.key === "Enter") {
				event.preventDefault();
				const selected = items[selectedIndex];
				if (selected) {
					navigateTo(selected.href);
				}
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [closePalette, isOpen, items, navigateTo, selectedIndex]);

	useEffect(() => {
		if (!isOpen) return;
		const timer = window.setTimeout(() => {
			inputRef.current?.focus();
		}, 0);

		return () => window.clearTimeout(timer);
	}, [isOpen]);

	return (
		<>
			<button
				type="button"
				onClick={openPalette}
				className="fixed bottom-5 right-5 z-40 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-sm bg-black/80 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
				aria-label="Open command palette"
			>
				<FaCompass className="w-4 h-4 text-neutral-400" />
				<span className="text-[11px] font-bold uppercase tracking-widest">Command</span>
				<span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-neutral-700 px-1.5 py-0.5 rounded-sm">
					Ctrl/Cmd + K
				</span>
			</button>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm px-4 py-8 sm:py-14"
					onClick={closePalette}
					role="dialog"
					aria-modal="true"
					aria-label="Global command palette"
				>
					<div
						className="w-full max-w-2xl mx-auto bg-neutral-950 border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="relative border-b border-neutral-800">
							<FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
							<input
								ref={inputRef}
								value={query}
								onChange={(event) => {
									setQuery(event.target.value);
									setSelectedIndex(0);
								}}
								placeholder="Search commands or players..."
								className="w-full bg-neutral-950 text-neutral-100 pl-11 pr-20 py-4 outline-none placeholder:text-neutral-600"
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-700 px-2 py-1 rounded-sm">
								ESC
							</span>
						</div>

						<div className="max-h-[60vh] overflow-y-auto">
							<div className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-900">
								Quick Navigation
							</div>

							{items.length === 0 && !isSearchingUsers && (
								<div className="p-6 text-center text-sm text-neutral-500">
									No results for &quot;{query}&quot;.
								</div>
							)}

							{items.map((item, index) => {
								const isSelected = index === selectedIndex;

								if (item.type === "command") {
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => navigateTo(item.href)}
											className={`w-full text-left px-4 py-3 border-b border-neutral-900 transition-colors ${
												isSelected ? "bg-neutral-800/80" : "hover:bg-neutral-900"
											}`}
										>
											<div className="flex items-center justify-between gap-4">
												<div className="flex items-center gap-3 min-w-0">
													<FaWandMagicSparkles className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
													<div className="min-w-0">
														<p className="text-sm font-bold text-neutral-200 truncate">
															{item.label}
														</p>
														<p className="text-[11px] text-neutral-500 truncate">
															{item.description}
														</p>
													</div>
												</div>
												<FaArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
											</div>
										</button>
									);
								}

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => navigateTo(item.href)}
										className={`w-full text-left px-4 py-3 border-b border-neutral-900 transition-colors cursor-pointer ${
											isSelected ? "bg-neutral-800/80" : "hover:bg-neutral-900"
										}`}
									>
										<div className="flex items-center justify-between gap-4">
											<div className="flex items-center gap-3 min-w-0">
												<FaUserGroup className="w-3.5 h-3.5 text-blue-400/80 shrink-0" />
												<div className="min-w-0">
													<p className="text-sm font-bold text-neutral-200 truncate">
														{item.username}
													</p>
													<p className="text-[11px] text-neutral-500 truncate">
														Open player profile
														{item.isAdministrator ? " • Admin" : ""}
													</p>
												</div>
											</div>
											<FaArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
										</div>
									</button>
								);
							})}

							{isSearchingUsers && (
								<div className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
									<span className="inline-block w-3 h-3 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
									Searching players...
								</div>
							)}
						</div>

						<div className="px-4 py-3 bg-black/40 border-t border-neutral-900 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-600">
							<span className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-1 rounded-sm">
								<FaDoorOpen className="w-3 h-3" />
								Enter
							</span>
							<span className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-1 rounded-sm">
								↑ ↓ Navigate
							</span>
							<span className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-1 rounded-sm">
								Esc Close
							</span>
							<span className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-1 rounded-sm">
								<FaShirt className="w-3 h-3" /> Wardrobe
							</span>
							<span className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-1 rounded-sm">
								<FaTrophy className="w-3 h-3" /> Leaderboard
							</span>
							<span className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-1 rounded-sm">
								<FaShield className="w-3 h-3" /> Admin
							</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
