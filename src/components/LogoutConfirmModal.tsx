"use client";

import { signOut } from "next-auth/react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

interface LogoutConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose }: LogoutConfirmModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(modalRef, onClose);

	if (!isOpen) {
		return null;
	}

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
			<div
				ref={modalRef}
				className="w-full max-w-sm bg-neutral-950 border border-neutral-800 border-t-4 border-t-red-900 p-6 sm:p-8 shadow-2xl relative text-center"
				role="dialog"
				aria-modal="true"
				aria-labelledby="logout-confirm-title"
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
					aria-label="Close logout confirmation"
				>
					<FaXmark className="w-6 h-6" />
				</button>

				<h2
					id="logout-confirm-title"
					className="text-xl font-black tracking-widest text-neutral-200 uppercase mb-4 mt-2"
				>
					Leave the Safehouse?
				</h2>

				<p className="text-sm text-neutral-400 font-medium tracking-wide mb-8">
					Are you sure you want to step back into the fog? You will need to sign in again.
				</p>

				<div className="flex gap-4">
					<button
						type="button"
						onClick={onClose}
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
	);
}
