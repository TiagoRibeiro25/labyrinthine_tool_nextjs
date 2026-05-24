import { METADATA } from "@/data/metadata";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Geist, Geist_Mono } from "next/font/google";
import Background from "../components/Background";
import Footer from "../components/Footer";
import NotificationsCenter from "../components/NotificationsCenter";
import UserQuickMenuLoader from "../components/UserQuickMenuLoader";
import AppProviders from "../components/providers/AppProviders";
import { authOptions } from "../lib/auth";
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
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;
	const userId = sessionUser?.id;
	const isLoggedIn = typeof userId === "string" && userId.length > 0;

	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<AppProviders>
					<Background>
						<OptionalClickSpark>
							<main>{children}</main>
							{isLoggedIn ? <NotificationsCenter /> : null}
							<Snowflakes />
							{isLoggedIn ? (
								<div className="fixed bottom-5 right-5 z-40 flex">
									<UserQuickMenuLoader userId={userId} />
								</div>
							) : null}
							<Footer />
						</OptionalClickSpark>
					</Background>
				</AppProviders>
			</body>
		</html>
	);
}
