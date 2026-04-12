"use client";

import { useDisclosure } from "../hooks/useDisclosure";
import EditProfileModal from "./EditProfileModal";

interface EditProfileButtonProps {
	initialData: {
		bio: string | null;
		discordUsername: string | null;
		discordAvatarUrl: string | null;
		useDiscordAvatar: boolean;
		steamProfileUrl: string | null;
		profileCommentVisibility: "everyone" | "friends_only" | "no_one";
		allowNonFriendProfileComments: boolean;
		profilePictureId: string | null;
		profileBannerId: string | null;
		favoriteCosmeticId: number | null;
	};
}

export default function EditProfileButton({ initialData }: EditProfileButtonProps) {
	const { isOpen, open, close } = useDisclosure();

	return (
		<>
			<button
				onClick={open}
				className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-800 text-neutral-200 font-bold text-sm uppercase tracking-widest border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.05)] cursor-pointer"
			>
				Edit Profile
			</button>

			{isOpen && (
				<EditProfileModal isOpen={isOpen} onClose={close} initialData={initialData} />
			)}
		</>
	);
}
