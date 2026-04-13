import { and, eq, or } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaUserGroup } from "react-icons/fa6";
import { db } from "../../../../db";
import { friendRequests, users } from "../../../../db/schema";
import { getUserAvatarUrl } from "../../../../lib/avatar";

interface ProfileFriendsPageProps {
	params: {
		username: string;
	};
}

type FriendUser = {
	id: string;
	username: string;
	profilePictureId: string | null;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
	isAdministrator: boolean;
};

export default async function ProfileFriendsPage({ params }: ProfileFriendsPageProps) {
	const { username } = await params;

	const targetUserResult = await db
		.select({
			id: users.id,
			username: users.username,
		})
		.from(users)
		.where(eq(users.username, username))
		.limit(1);

	const targetUser = targetUserResult[0];

	if (!targetUser) {
		notFound();
	}

	const acceptedConnections = await db.query.friendRequests.findMany({
		where: and(
			eq(friendRequests.status, "accepted"),
			or(
				eq(friendRequests.senderId, targetUser.id),
				eq(friendRequests.receiverId, targetUser.id)
			)
		),
		with: {
			sender: {
				columns: {
					id: true,
					username: true,
					profilePictureId: true,
					discordAvatarUrl: true,
					useDiscordAvatar: true,
					isAdministrator: true,
				},
			},
			receiver: {
				columns: {
					id: true,
					username: true,
					profilePictureId: true,
					discordAvatarUrl: true,
					useDiscordAvatar: true,
					isAdministrator: true,
				},
			},
		},
	});

	const friends = acceptedConnections
		.map((connection) => {
			const friend =
				connection.senderId === targetUser.id ? connection.receiver : connection.sender;
			return {
				id: connection.id,
				user: friend as FriendUser,
			};
		})
		.sort((a, b) => a.user.username.localeCompare(b.user.username));

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-6xl flex flex-col items-center text-center mb-10">
				<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-4 flex items-center justify-center gap-3">
					<FaUserGroup className="text-neutral-600" />
					Connections
				</h1>
				<p className="text-sm sm:text-base text-neutral-400 font-medium tracking-wide mb-8 max-w-2xl">
					<span className="text-neutral-200 font-bold">{targetUser.username}</span> has {" "}
					{friends.length} {friends.length === 1 ? "friend" : "friends"} in the fog.
				</p>
				<Link
					href={`/profile/${targetUser.username}`}
					className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-500 transition-all duration-300"
				>
					<FaArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
					Back to Profile
				</Link>
			</div>

			<section className="w-full max-w-6xl">
				{friends.length === 0 ? (
					<div className="w-full text-center py-10 border border-dashed border-neutral-800 rounded-sm bg-neutral-950/30">
						<p className="text-neutral-500 font-medium italic">
							No active friends found for this survivor.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{friends.map(({ id, user }) => (
							<Link
								key={id}
								href={`/profile/${user.username}`}
								className="flex items-center gap-3 p-3 sm:p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800/80 transition-colors group"
							>
								<div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
									<Image
										src={getUserAvatarUrl(user)}
										alt={user.username}
										fill
										className="object-cover group-hover:scale-110 transition-transform duration-500"
										sizes="96px"
									/>
								</div>
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-neutral-200 font-bold truncate group-hover:text-white transition-colors text-sm sm:text-base">
											{user.username}
										</span>
										{user.isAdministrator && (
											<span className="px-1.5 py-0.5 bg-red-950/50 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-900/50 rounded-sm shrink-0">
												Admin
											</span>
										)}
									</div>
									<span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mt-0.5">
										View Profile
									</span>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
