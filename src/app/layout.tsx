import { METADATA } from "@/data/metadata";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Background from "../components/Background";
import CommandPalette from "../components/CommandPalette";
import Footer from "../components/Footer";
import NotificationsCenter from "../components/NotificationsCenter";
import AppProviders from "../components/providers/AppProviders";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = METADATA;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<AppProviders>
					<Background>
						<main>{children}</main>
						<NotificationsCenter />
						<CommandPalette />
						<Footer />
					</Background>
				</AppProviders>
			</body>
		</html>
	);
}
