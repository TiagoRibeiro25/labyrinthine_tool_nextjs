import { METADATA } from "@/data/metadata";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Background from "../components/Background";
import Footer from "../components/Footer";
import NotificationsCenter from "../components/NotificationsCenter";
import UserQuickMenu from "../components/UserQuickMenu";
import AppProviders from "../components/providers/AppProviders";
import { getUserQuickMenuData } from "../lib/layout-user-menu";
import { getValidatedServerSession } from "../lib/session-user";
import OptionalClickSpark from "../components/OptionalClickSpark";
import "./globals.css";
import Snowflakes from "@/components/Snowflakes";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = METADATA;

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getValidatedServerSession();
	const sessionUser = session?.user as { id?: string } | undefined;
	const userId = sessionUser?.id;
	const isLoggedIn = typeof userId === "string" && userId.length > 0;
	const quickMenuUser = isLoggedIn ? await getUserQuickMenuData(userId) : null;

	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<AppProviders session={session}>
					<Background>
						<OptionalClickSpark>
							<main>{children}</main>
							{isLoggedIn ? <NotificationsCenter /> : null}
							<Snowflakes />
							{quickMenuUser ? (
								<div className="fixed bottom-5 right-5 z-40 flex">
									<UserQuickMenu
										username={quickMenuUser.username}
										avatarUrl={quickMenuUser.avatarUrl}
									/>
								</div>
							) : null}
							<Footer isAuthenticated={isLoggedIn} />
						</OptionalClickSpark>
					</Background>
				</AppProviders>
			</body>
		</html>
	);
}
