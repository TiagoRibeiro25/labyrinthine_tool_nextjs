import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FaMagnifyingGlass, FaArrowLeft, FaUserGroup } from "react-icons/fa6";
import LogoutButton from "../../components/LogoutButton";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    const sessionUser = session?.user as
        | { id?: string; name?: string | null }
        | undefined;

    if (!session || !sessionUser || !sessionUser.id) {
        redirect("/login");
    }

    const currentUserId = sessionUser.id;
    const targetUserResult = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

    const targetUser = targetUserResult[0];

    if (!targetUser) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center py-12 px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-4xl p-8 sm:p-12 bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative text-center flex flex-col items-center">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-700 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mb-4">
                    The Safehouse
                </h1>
                <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-neutral-400 uppercase mb-8">
                    Welcome, {targetUser.username}
                </h2>

                <p className="text-base text-neutral-500 font-medium tracking-wide mb-8">
                    Your cosmetics dashboard is currently under construction.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    <Link
                        href={`/profile/${targetUser.username}`}
                        className="group inline-flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-sm uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                        View Profile
                    </Link>

                    <Link
                        href="/search"
                        className="group inline-flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900/50 text-neutral-300 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                        <FaMagnifyingGlass className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                        Find Survivors
                    </Link>

                    <Link
                        href="/friends"
                        className="group inline-flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900/50 text-neutral-300 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                        <FaUserGroup className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                        Connections
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                    >
                        <FaArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Return to Home
                    </Link>
                    <LogoutButton />
                </div>
            </div>
        </main>
    );
}
