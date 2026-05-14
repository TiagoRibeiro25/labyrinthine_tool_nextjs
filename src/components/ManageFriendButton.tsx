"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FaCheck, FaXmark, FaUserXmark } from "react-icons/fa6";
import { createPortal } from "react-dom";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { useDisclosure } from "../hooks/useDisclosure";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

interface ManageFriendButtonProps {
	requestId: string;
	action: "accept" | "reject" | "remove";
	label?: string;
}

export default function ManageFriendButton({
	requestId,
	action,
	label,
}: ManageFriendButtonProps) {
	const router = useRouter();
	const { loading, execute } = useApi();
	const { success, error } = useToast();
	const { isOpen: isRemoveModalOpen, open: openRemoveModal, close: closeRemoveModal } = useDisclosure();
	const removeModalRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(removeModalRef, closeRemoveModal);

	const handleAction = async () => {
		try {
			await execute("/api/friends", {
				method: "POST",
				body: JSON.stringify({
					action,
					requestId,
				}),
			});

			const actionLabel =
				action === "accept" ? "accepted" : action === "reject" ? "rejected" : "removed";
			success("Action completed", `Friend request ${actionLabel}.`);

			// Instantly refresh the server component to reflect the new state
			router.refresh();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to manage friend action.";
			error("Action failed", message);
			console.error("Failed to manage friend action:", err);
		}
	};

	let icon = null;
	const baseStyles =
		"flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-sm font-bold text-[10px] sm:text-xs uppercase tracking-widest border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
	let colorStyles = "";

	if (action === "accept") {
		icon = <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />;
		colorStyles =
			"bg-neutral-900 border-neutral-700 text-emerald-500 hover:bg-neutral-800 hover:border-emerald-500 hover:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]";
	} else if (action === "reject") {
		icon = <FaXmark className="w-3 h-3 sm:w-4 sm:h-4" />;
		colorStyles =
			"bg-neutral-900/50 border-neutral-800 text-red-500 hover:bg-red-950/30 hover:border-red-900 hover:text-red-400";
	} else if (action === "remove") {
		icon = <FaUserXmark className="w-3 h-3 sm:w-4 sm:h-4" />;
		colorStyles =
			"bg-neutral-900/50 border-neutral-800 text-red-500 hover:bg-red-950/30 hover:border-red-900 hover:text-red-400";
	}

	if (action === "remove") {
		return (
			<>
				<button
					onClick={openRemoveModal}
					disabled={loading}
					className={`${baseStyles} ${colorStyles}`}
					title={action.charAt(0).toUpperCase() + action.slice(1)}
				>
					{loading ? (
						<span className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full shrink-0" />
					) : (
						icon
					)}
					{label && <span>{label}</span>}
				</button>

				{isRemoveModalOpen &&
					createPortal(
						<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
							<div
								ref={removeModalRef}
								className="w-full max-w-sm bg-neutral-950 border border-neutral-800 border-t-4 border-t-red-900 p-6 sm:p-8 shadow-2xl relative text-center"
							>
								<button
									onClick={closeRemoveModal}
									className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
								>
									<FaXmark className="w-6 h-6" />
								</button>

								<h2 className="text-xl font-black tracking-widest text-neutral-200 uppercase mb-4 mt-2">
									Remove Friend?
								</h2>

								<p className="text-sm text-neutral-400 font-medium tracking-wide mb-8">
									Are you sure you want to remove this friend?
								</p>

								<div className="flex gap-4">
									<button
										onClick={closeRemoveModal}
										className="flex-1 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 transition-all duration-300 cursor-pointer"
									>
										Keep
									</button>
									<button
										onClick={() => {
											closeRemoveModal();
											handleAction();
										}}
										disabled={loading}
										className="flex-1 px-6 py-3 rounded-sm bg-red-950 text-red-200 font-bold text-sm uppercase tracking-widest border border-red-900 hover:bg-red-900 hover:border-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Remove
									</button>
								</div>
							</div>
						</div>,
						document.body
					)}
			</>
		);
	}

	return (
		<button
			onClick={handleAction}
			disabled={loading}
			className={`${baseStyles} ${colorStyles}`}
			title={action.charAt(0).toUpperCase() + action.slice(1)}
		>
			{loading ? (
				<span className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full shrink-0" />
			) : (
				icon
			)}
			{label && <span>{label}</span>}
		</button>
	);
}
