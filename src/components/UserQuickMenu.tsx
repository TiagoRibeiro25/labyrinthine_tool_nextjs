"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import {
	FaArrowRightFromBracket,
	FaShirt,
	FaUser,
	FaUserGroup,
	FaXmark,
} from "react-icons/fa6";
import { useDisclosure } from "../hooks/useDisclosure";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

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
	const logoutModalRef = useRef<HTMLDivElement>(null);
	const { isOpen, toggle, close } = useDisclosure();
	const {
		isOpen: isLogoutOpen,
		open: openLogout,
		close: closeLogout,
	} = useDisclosure();

	useOnClickOutside(menuRef, close);
	useOnClickOutside(logoutModalRef, closeLogout);

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

			{isLogoutOpen &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
						<div
							ref={logoutModalRef}
							className="w-full max-w-sm bg-neutral-950 border border-neutral-800 border-t-4 border-t-red-900 p-6 sm:p-8 shadow-2xl relative text-center"
						>
							<button
								type="button"
								onClick={closeLogout}
								className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
								aria-label="Close logout confirmation"
							>
								<FaXmark className="w-6 h-6" />
							</button>

							<h2 className="text-xl font-black tracking-widest text-neutral-200 uppercase mb-4 mt-2">
								Leave the Safehouse?
							</h2>

							<p className="text-sm text-neutral-400 font-medium tracking-wide mb-8">
								Are you sure you want to step back into the fog? You will need to sign in
								again.
							</p>

							<div className="flex gap-4">
								<button
									type="button"
									onClick={closeLogout}
									className="flex-1 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 transition-all duration-300 cursor-pointer"
								>
									Stay
								</button>
								<button
									type="button"
									onClick={() => signOut({ callbackUrl: "/" })}
									className="flex-1 px-6 py-3 rounded-sm bg-red-950 text-red-200 font-bold text-sm uppercase tracking-widest border border-red-900 hover:bg-red-900 hover:border-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] cursor-pointer"
								>
									Leave
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
