import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Background from "../components/Background";
import Footer from "../components/Footer";
import CommandPalette from "../components/CommandPalette";
import AppProviders from "../components/providers/AppProviders";
import { METADATA } from "@/data/metadata";

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
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <AppProviders>
                    <Background>
                        <main>{children}</main>
                        <CommandPalette />
                        <Footer />
                    </Background>
                </AppProviders>
            </body>
        </html>
    );
}
