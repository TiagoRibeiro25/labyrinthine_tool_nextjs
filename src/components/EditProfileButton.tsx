"use client";

import EditProfileModal from "./EditProfileModal";
import { useDisclosure } from "../hooks/useDisclosure";

interface EditProfileButtonProps {
    initialData: {
        discordUsername: string | null;
        steamProfileUrl: string | null;
        profilePictureId: string | null;
    };
}

export default function EditProfileButton({
    initialData,
}: EditProfileButtonProps) {
    const { isOpen, open, close } = useDisclosure();

    return (
        <>
            <button
                onClick={open}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-800 text-neutral-200 font-bold text-sm uppercase tracking-widest border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.05)] cursor-pointer"
            >
                Edit Profile
            </button>

            <EditProfileModal
                isOpen={isOpen}
                onClose={close}
                initialData={initialData}
            />
        </>
    );
}
