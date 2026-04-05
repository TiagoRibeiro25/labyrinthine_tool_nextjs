"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUserPlus, FaUserXmark } from "react-icons/fa6";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

interface FriendActionsProps {
    targetUsername: string;
    initialStatus: FriendStatus;
    initialRequestId?: string | null;
}

export default function FriendActions({
    targetUsername,
    initialStatus,
    initialRequestId = null,
}: FriendActionsProps) {
    const router = useRouter();
    const [status, setStatus] = useState<FriendStatus>(initialStatus);
    const [requestId, setRequestId] = useState<string | null>(initialRequestId);
    const { loading, error, execute } = useApi();
    const { success: showSuccess, error: showError } = useToast();

    const handleAction = async (
        action: "add" | "accept" | "reject" | "remove",
    ) => {
        try {
            await execute("/api/friends", {
                method: "POST",
                body: JSON.stringify({
                    action,
                    receiverUsername: targetUsername,
                    ...(requestId ? { requestId } : {}),
                }),
            });

            // Optimistic UI updates
            if (action === "add") {
                setStatus("pending_sent");
                showSuccess(
                    "Friend request sent",
                    `Request sent to ${targetUsername}.`,
                );
            } else if (action === "accept") {
                setStatus("friends");
                showSuccess(
                    "Friend request accepted",
                    `You are now friends with ${targetUsername}.`,
                );
            } else if (action === "reject" || action === "remove") {
                setStatus("none");
                setRequestId(null);
                showSuccess(
                    action === "reject"
                        ? "Friend request rejected"
                        : "Friend removed",
                    action === "reject"
                        ? `You rejected ${targetUsername}'s request.`
                        : `${targetUsername} was removed from your friends.`,
                );
            }

            router.refresh();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Could not complete the friend action.";
            showError("Action failed", message);
        }
    };

    if (error) {
        return (
            <div className="text-red-500 text-xs font-bold uppercase tracking-widest mt-4 text-center">
                {error}
            </div>
        );
    }

    if (status === "none") {
        return (
            <button
                onClick={() => handleAction("add")}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-900 text-neutral-200 font-bold text-sm uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FaUserPlus className="w-4 h-4" />
                {loading ? "Sending..." : "Add Friend"}
            </button>
        );
    }

    if (status === "pending_sent") {
        return (
            <button
                onClick={() => handleAction("remove")} // "remove" action also cancels requests in our API
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-red-950/50 hover:text-red-400 hover:border-red-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Canceling..." : "Cancel Request"}
            </button>
        );
    }

    if (status === "pending_received") {
        return (
            <div className="w-full mt-4 flex gap-3">
                <button
                    onClick={() => handleAction("accept")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-3 rounded-sm bg-neutral-900 text-emerald-500 font-bold text-xs sm:text-sm uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Accept
                </button>
                <button
                    onClick={() => handleAction("reject")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-3 rounded-sm bg-neutral-900/50 text-red-500 font-bold text-xs sm:text-sm uppercase tracking-widest border border-neutral-800 hover:bg-red-950/30 hover:border-red-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Reject
                </button>
            </div>
        );
    }

    if (status === "friends") {
        return (
            <button
                onClick={() => handleAction("remove")}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-red-950/30 hover:text-red-500 hover:border-red-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FaUserXmark className="w-4 h-4" />
                {loading ? "Removing..." : "Remove Friend"}
            </button>
        );
    }

    return null;
}
