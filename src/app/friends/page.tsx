import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaUserGroup, FaArrowLeft } from "react-icons/fa6";
import { db } from "../../db";
import { friendRequests } from "../../db/schema";
import { eq, or } from "drizzle-orm";
import ManageFriendButton from "../../components/ManageFriendButton";

type ConnectionUser = {
    id: string;
    username: string;
    profilePictureId: string | null;
    isAdministrator: boolean;
};

export default async function FriendsPage() {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;

    if (!session || !sessionUser || !sessionUser.id) {
        redirect("/login");
    }

    const currentUserId = sessionUser.id;

    // Fetch all friend requests involving the current user
    // Using Drizzle's relational query API for clean joins
    const allConnections = await db.query.friendRequests.findMany({
        where: or(
            eq(friendRequests.senderId, currentUserId),
            eq(friendRequests.receiverId, currentUserId),
        ),
        with: {
            sender: {
                columns: {
                    id: true,
                    username: true,
                    profilePictureId: true,
                    isAdministrator: true,
                },
            },
            receiver: {
                columns: {
                    id: true,
                    username: true,
                    profilePictureId: true,
                    isAdministrator: true,
                },
            },
        },
    });

    // Categorize connections
    const friends: { id: string; user: ConnectionUser }[] = [];
    const receivedRequests: { id: string; user: ConnectionUser }[] = [];
    const sentRequests: { id: string; user: ConnectionUser }[] = [];

    allConnections.forEach((conn) => {
        const isSender = conn.senderId === currentUserId;
        const otherUser = isSender ? conn.receiver : conn.sender;

        if (conn.status === "accepted") {
            friends.push({ id: conn.id, user: otherUser });
        } else if (conn.status === "pending") {
            if (isSender) {
                sentRequests.push({ id: conn.id, user: otherUser });
            } else {
                receivedRequests.push({ id: conn.id, user: otherUser });
            }
        }
    });

    // Reusable user row component
    const UserRow = ({
        user,
        actions,
    }: {
        user: ConnectionUser;
        actions: React.ReactNode;
    }) => (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800/80 transition-colors group">
            <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0"
            >
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
                    <Image
                        src={
                            user.profilePictureId
                                ? `/images/profile_pictures/${user.profilePictureId}.webp`
                                : `/images/profile_pictures/1.webp`
                        }
                        alt={user.username}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="200px"
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
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
        </div>
    );

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-4xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
                <div className="mb-10 text-center sm:text-left border-b border-neutral-800/80 pb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
                            <FaUserGroup className="text-neutral-600" />
                            Connections
                        </h1>
                        <p className="text-sm text-neutral-400 font-medium tracking-wide">
                            Manage your fellow survivors and friend requests.
                        </p>
                    </div>
                    <Link
                        href="/search"
                        className="px-6 py-2.5 rounded-sm bg-neutral-900 text-neutral-300 font-bold text-xs uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500 hover:text-white transition-all shadow-[0_0_10px_rgba(255,255,255,0.02)]"
                    >
                        Find Players
                    </Link>
                </div>

                <div className="space-y-12">
                    {/* RECEIVED REQUESTS */}
                    {receivedRequests.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold tracking-widest text-emerald-500 uppercase mb-4 flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Pending Invites ({receivedRequests.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {receivedRequests.map(({ id, user }) => (
                                    <UserRow
                                        key={id}
                                        user={user}
                                        actions={
                                            <>
                                                <ManageFriendButton
                                                    requestId={id}
                                                    action="accept"
                                                />
                                                <ManageFriendButton
                                                    requestId={id}
                                                    action="reject"
                                                />
                                            </>
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ACTIVE FRIENDS */}
                    <section>
                        <h2 className="text-sm font-bold tracking-widest text-neutral-400 uppercase mb-4 border-b border-neutral-800/50 pb-2">
                            Active Friends ({friends.length})
                        </h2>
                        {friends.length === 0 ? (
                            <div className="w-full text-center py-10 border border-dashed border-neutral-800 rounded-sm bg-neutral-950/30">
                                <p className="text-neutral-500 font-medium italic">
                                    You have no friends yet. It is dangerous to
                                    go alone into the fog.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {friends.map(({ id, user }) => (
                                    <UserRow
                                        key={id}
                                        user={user}
                                        actions={
                                            <ManageFriendButton
                                                requestId={id}
                                                action="remove"
                                            />
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* SENT REQUESTS */}
                    {sentRequests.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold tracking-widest text-neutral-500 uppercase mb-4 border-b border-neutral-800/50 pb-2">
                                Sent Requests ({sentRequests.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sentRequests.map(({ id, user }) => (
                                    <UserRow
                                        key={id}
                                        user={user}
                                        actions={
                                            <ManageFriendButton
                                                requestId={id}
                                                action="remove"
                                                label="Cancel"
                                            />
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="mt-12 border-t border-neutral-800/80 pt-6">
                    <Link
                        href="/dashboard"
                        className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2 w-fit mx-auto sm:mx-0"
                    >
                        <FaArrowLeft className="w-3.5 h-3.5" />
                        Return to Safehouse
                    </Link>
                </div>
            </div>
        </main>
    );
}
