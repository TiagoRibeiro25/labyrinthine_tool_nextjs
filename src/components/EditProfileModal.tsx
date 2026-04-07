"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import { PROFILE_BANNER_OPTIONS } from "../data/profile-banners";
import { useApi } from "../hooks/useApi";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { useToast } from "../hooks/useToast";
import { allCosmetics } from "../lib/cosmetics";

const availableAvatars = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface EditProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialData: {
		bio: string | null;
		discordUsername: string | null;
		steamProfileUrl: string | null;
		profilePictureId: string | null;
		profileBannerId: string | null;
		favoriteCosmeticId: number | null;
	};
}

export default function EditProfileModal({
	isOpen,
	onClose,
	initialData,
}: EditProfileModalProps) {
	const router = useRouter();
	const modalRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(modalRef, onClose);

	useEffect(() => {
		if (!isOpen || typeof document === "undefined") {
			return;
		}

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen]);

	const [discordUsername, setDiscordUsername] = useState<string>(
		initialData.discordUsername || ""
	);
	const [bio, setBio] = useState<string>(initialData.bio || "");
	const [steamProfileUrl, setSteamProfileUrl] = useState<string>(
		initialData.steamProfileUrl || ""
	);
	const [profilePictureId, setProfilePictureId] = useState<string>(
		initialData.profilePictureId || "1"
	);
	const [profileBannerId, setProfileBannerId] = useState<string>(
		initialData.profileBannerId || "chap1"
	);
	const [favoriteCosmeticId, setFavoriteCosmeticId] = useState<string>(
		initialData.favoriteCosmeticId ? String(initialData.favoriteCosmeticId) : ""
	);
	const [localError, setLocalError] = useState<string>("");
	const { loading, error: apiError, execute, setError: setApiError } = useApi();
	const toast = useToast();

	const error = localError || apiError;

	if (!isOpen || typeof document === "undefined") return null;

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLocalError("");
		setApiError(null);

		if (steamProfileUrl) {
			const steamRegex =
				/^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/;
			if (!steamRegex.test(steamProfileUrl)) {
				setLocalError(
					"Invalid Steam Profile URL. Must be a valid steamcommunity.com link."
				);
				return;
			}
		}

		try {
			await execute("/api/profile", {
				method: "PUT",
				body: JSON.stringify({
					bio,
					discordUsername,
					steamProfileUrl,
					profilePictureId,
					profileBannerId,
					favoriteCosmeticId: favoriteCosmeticId ? Number(favoriteCosmeticId) : null,
				}),
			});

			toast.success("Profile updated", "Your profile changes were saved.");
			router.refresh();
			onClose();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save profile changes.";
			toast.error("Could not update profile", message);
		}
	};

	const modalContent = (
		<div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 py-4 sm:px-6 sm:py-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
			<div
				ref={modalRef}
				className="w-full max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-neutral-950 border border-neutral-800 border-t-4 border-t-neutral-600 p-5 sm:p-8 shadow-2xl relative overflow-hidden my-auto"
			>
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

				<form
					onSubmit={handleSubmit}
					className="space-y-5 overflow-y-auto max-h-[calc(100vh-11rem)] sm:max-h-[calc(90vh-9rem)] pr-2 sm:pr-3"
				>
					<div className="space-y-2">
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Bio
						</label>
						<textarea
							placeholder="Tell other survivors about your journey..."
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							maxLength={280}
							rows={4}
							className="w-full resize-none bg-neutral-900/50 border border-neutral-800 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-all placeholder:text-neutral-700"
						/>
						<p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase text-right">
							{bio.length}/280
						</p>
					</div>

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
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Favorite Cosmetic
						</label>
						<select
							value={favoriteCosmeticId}
							onChange={(e) => setFavoriteCosmeticId(e.target.value)}
							className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-all"
						>
							<option value="">No favorite selected</option>
							{allCosmetics.map((cosmetic) => (
								<option key={cosmetic.id} value={cosmetic.id}>
									{cosmetic.name}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
							Profile Banner
						</label>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
							{PROFILE_BANNER_OPTIONS.map((banner) => (
								<button
									key={banner.id}
									type="button"
									onClick={() => setProfileBannerId(banner.id)}
									className={`relative w-full aspect-21/7 overflow-hidden rounded-sm border transition-all ${
										profileBannerId === banner.id
											? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
											: "border-neutral-800 hover:border-neutral-500"
									}`}
								>
									<Image
										src={banner.imageUrl}
										alt={banner.label}
										fill
										className="object-cover"
										sizes="220px"
									/>
									<div className="absolute inset-0 bg-black/45" />
									<span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-widest text-neutral-100">
										{banner.label}
									</span>
								</button>
							))}
						</div>
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
										sizes="200px"
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

	return createPortal(modalContent, document.body);
}
