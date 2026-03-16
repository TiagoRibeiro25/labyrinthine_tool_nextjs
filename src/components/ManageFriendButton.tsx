"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaXmark, FaUserXmark } from "react-icons/fa6";

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
    const [loading, setLoading] = useState<boolean>(false);

    const handleAction = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/friends", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action,
                    requestId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to perform action");
            }

            // Instantly refresh the server component to reflect the new state
            router.refresh();
        } catch (err) {
            console.error("Failed to manage friend action:", err);
            // Optionally could add a toast notification system here in the future
        } finally {
            setLoading(false);
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
