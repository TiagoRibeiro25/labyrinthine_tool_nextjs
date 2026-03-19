"use client";

import { useRef } from "react";
import { signOut } from "next-auth/react";
import { FaArrowRightFromBracket, FaXmark } from "react-icons/fa6";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { useDisclosure } from "../hooks/useDisclosure";

export default function LogoutButton() {
    const { isOpen, open, close } = useDisclosure();
    const modalRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(modalRef, close);

    return (
        <>
            <button
                onClick={open}
                className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full sm:w-auto cursor-pointer"
            >
                <FaArrowRightFromBracket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                Logout
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        ref={modalRef}
                        className="w-full max-w-sm bg-neutral-950 border border-neutral-800 border-t-4 border-t-red-900 p-6 sm:p-8 shadow-2xl relative text-center"
                    >
                        <button
                            onClick={close}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                        >
                            <FaXmark className="w-6 h-6" />
                        </button>

                        <h2 className="text-xl font-black tracking-widest text-neutral-200 uppercase mb-4 mt-2">
                            Leave the Safehouse?
                        </h2>

                        <p className="text-sm text-neutral-400 font-medium tracking-wide mb-8">
                            Are you sure you want to step back into the fog? You
                            will need to sign in again.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={close}
                                className="flex-1 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 transition-all duration-300 cursor-pointer"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="flex-1 px-6 py-3 rounded-sm bg-red-950 text-red-200 font-bold text-sm uppercase tracking-widest border border-red-900 hover:bg-red-900 hover:border-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] cursor-pointer"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
