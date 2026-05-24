"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FaArrowRightFromBracket, FaShirt, FaUser, FaUserGroup } from "react-icons/fa6";
import { useDisclosure } from "../hooks/useDisclosure";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import LogoutConfirmModal from "./LogoutConfirmModal";

interface UserQuickMenuProps {
	username: string;
	avatarUrl: string;
}

const MENU_ITEMS = [
	{
		id: "profile",
		label: "Profile",
		getHref: (username: string) => `/profile/${encodeURIComponent(username)}`,
		icon: FaUser,
	},
	{
		id: "friends",
		label: "Friends",
		getHref: () => "/friends",
		icon: FaUserGroup,
	},
	{
		id: "wardrobe",
		label: "Wardrobe",
		getHref: () => "/cosmetics",
		icon: FaShirt,
	},
] as const;

export default function UserQuickMenu({ username, avatarUrl }: UserQuickMenuProps) {
	const router = useRouter();
	const menuRef = useRef<HTMLDivElement>(null);
	const { isOpen, toggle, close } = useDisclosure();
	const {
		isOpen: isLogoutOpen,
		open: openLogout,
		close: closeLogout,
	} = useDisclosure();

	useOnClickOutside(menuRef, close);

	const handleNavigate = (href: string) => {
		close();
		router.push(href);
	};

	return (
		<>
			<div ref={menuRef} className="relative">
				<button
					type="button"
					onClick={toggle}
					className="relative h-11 w-11 overflow-hidden rounded-full border border-neutral-700 bg-black/80 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-neutral-400 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] cursor-pointer"
					aria-label="Open account menu"
					aria-expanded={isOpen}
					aria-haspopup="menu"
				>
					<Image
						src={avatarUrl}
						alt={username}
						fill
						className="object-cover"
						sizes="44px"
					/>
				</button>

				{isOpen ? (
					<div
						role="menu"
						aria-label="Account menu"
						className="absolute bottom-full right-0 mb-2 w-52 rounded-sm border border-neutral-800 bg-neutral-950/95 py-1 shadow-[0_0_40px_rgba(0,0,0,0.85)] backdrop-blur-md"
					>
						<div className="border-b border-neutral-900 px-3 py-2.5">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
								Signed in as
							</p>
							<p className="mt-0.5 truncate text-sm font-bold text-neutral-100">
								{username}
							</p>
						</div>

						{MENU_ITEMS.map((item) => {
							const Icon = item.icon;
							const href = item.getHref(username);

							return (
								<button
									key={item.id}
									type="button"
									role="menuitem"
									onClick={() => handleNavigate(href)}
									className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-neutral-100 cursor-pointer"
								>
									<Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
									{item.label}
								</button>
							);
						})}

						<div className="my-1 border-t border-neutral-900" />

						<button
							type="button"
							role="menuitem"
							onClick={() => {
								close();
								openLogout();
							}}
							className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-red-300/90 transition-colors hover:bg-red-950/40 hover:text-red-200 cursor-pointer"
						>
							<FaArrowRightFromBracket className="h-3.5 w-3.5 shrink-0" />
							Logout
						</button>
					</div>
				) : null}
			</div>

			<LogoutConfirmModal isOpen={isLogoutOpen} onClose={closeLogout} />
		</>
	);
}
