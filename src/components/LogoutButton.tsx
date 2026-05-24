"use client";

import { FaArrowRightFromBracket } from "react-icons/fa6";
import { useDisclosure } from "../hooks/useDisclosure";
import LogoutConfirmModal from "./LogoutConfirmModal";

export default function LogoutButton() {
	const { isOpen, open, close } = useDisclosure();

	return (
		<>
			<button
				type="button"
				onClick={open}
				className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full sm:w-auto cursor-pointer"
			>
				<FaArrowRightFromBracket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				Logout
			</button>

			<LogoutConfirmModal isOpen={isOpen} onClose={close} />
		</>
	);
}
