"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaXmark } from "react-icons/fa6";

const availableAvatars = ["1", "2", "3", "4", "5", "6"];

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: {
        discordUsername: string | null;
        steamProfileUrl: string | null;
        profilePictureId: string | null;
    };
}

export default function EditProfileModal({
    isOpen,
    onClose,
    initialData,
}: EditProfileModalProps) {
    const router = useRouter();
    const [discordUsername, setDiscordUsername] = useState<string>(
        initialData.discordUsername || "",
    );
    const [steamProfileUrl, setSteamProfileUrl] = useState<string>(
        initialData.steamProfileUrl || "",
    );
    const [profilePictureId, setProfilePictureId] = useState<string>(
        initialData.profilePictureId || "1",
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    useEffect(() => {
        if (isOpen) {
            setDiscordUsername(initialData.discordUsername || "");
            setSteamProfileUrl(initialData.steamProfileUrl || "");
            setProfilePictureId(initialData.profilePictureId || "1");
            setError("");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (steamProfileUrl) {
            const steamRegex =
                /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/;
            if (!steamRegex.test(steamProfileUrl)) {
                setError(
                    "Invalid Steam Profile URL. Must be a valid steamcommunity.com link.",
                );
                setLoading(false);
                return;
            }
        }

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discordUsername,
                    steamProfileUrl,
                    profilePictureId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update profile.");
            }

            router.refresh();
            onClose();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 border-t-4 border-t-neutral-600 p-6 sm:p-8 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    disabled={loading}
                >
                    <FaXmark className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-6">
                    Edit Profile
                </h2>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/50 border border-red-900 text-red-200 text-sm font-medium text-center rounded-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
                            Discord Username
                        </label>
                        <input
                            type="text"
                            placeholder="Survivor#1234"
                            value={discordUsername}
                            onChange={(e) => setDiscordUsername(e.target.value)}
                            className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-all placeholder:text-neutral-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
                            Steam Profile URL
                        </label>
                        <input
                            type="url"
                            placeholder="https://steamcommunity.com/id/..."
                            value={steamProfileUrl}
                            onChange={(e) => setSteamProfileUrl(e.target.value)}
                            className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-all placeholder:text-neutral-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                            Select Profile Picture
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {availableAvatars.map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setProfilePictureId(id)}
                                    className={`relative aspect-square overflow-hidden rounded-sm border-2 transition-all ${
                                        profilePictureId === id
                                            ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-105"
                                            : "border-neutral-800 hover:border-neutral-500 hover:scale-105 opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <Image
                                        src={`/images/profile_pictures/${id}.webp`}
                                        alt={`Avatar ${id}`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-sm bg-neutral-800 text-neutral-100 font-bold text-sm uppercase tracking-widest border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
