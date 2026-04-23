"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa";

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [discordLoading, setDiscordLoading] = useState<boolean>(false);

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await signIn("credentials", {
				username,
				password,
				redirect: false,
			});

			if (res?.error) {
				setError("Invalid username or password.");
			} else {
				router.push("/dashboard");
				router.refresh();
			}
		} catch {
			setError("An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	};

	const handleDiscordLogin = async () => {
		setError("");
		setDiscordLoading(true);

		try {
			await signIn("discord", {
				callbackUrl: "/dashboard",
			});
		} catch {
			setError("Could not start Discord login.");
			setDiscordLoading(false);
		}
	};

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-lg p-6 sm:p-8 lg:p-10 rounded-3xl bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(19,24,29,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative">
				<div className="mb-8 text-center">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 uppercase mb-2">
						Return to the Fog
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Sign in to access your cosmetics tracker.
					</p>
				</div>

				{error && (
					<div className="mb-6 p-3 bg-red-950/50 border border-red-900 text-red-200 text-sm font-medium text-center rounded-xl">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Username
						</label>
						<input
							type="text"
							placeholder="Survivor"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-xl focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
						/>
					</div>

					<div className="space-y-2 flex flex-col">
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Password
						</label>
						<input
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-xl focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
						/>
					</div>

					<button
						type="submit"
						disabled={loading || discordLoading}
						className="w-full mt-4 group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-neutral-900 text-neutral-100 font-bold text-sm sm:text-base uppercase tracking-[0.14em] border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
					>
						{loading ? "Entering..." : "Sign In"}
					</button>
				</form>

				<div className="my-6 flex items-center gap-3">
					<div className="h-px flex-1 bg-neutral-800" />
					<span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
						Or
					</span>
					<div className="h-px flex-1 bg-neutral-800" />
				</div>

				<button
					type="button"
					onClick={handleDiscordLogin}
					disabled={loading || discordLoading}
					className="w-full group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-neutral-900 text-neutral-100 font-bold text-sm sm:text-base uppercase tracking-[0.14em] border border-[#5865F2]/70 hover:bg-neutral-800 hover:border-[#5865F2] transition-all duration-300 shadow-[0_0_15px_rgba(88,101,242,0.18)] hover:shadow-[0_0_28px_rgba(88,101,242,0.3)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
				>
					<FaDiscord className="h-4 w-4 sm:h-5 sm:w-5 text-[#5865F2]" />
					{discordLoading ? "Redirecting..." : "Login with Discord"}
				</button>

				<div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
					<p className="text-sm text-neutral-500">
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="text-neutral-300 font-bold hover:text-white hover:underline transition-colors"
						>
							Sign Up
						</Link>
					</p>
				</div>
			</div>

			<Link
				href="/"
				className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
			>
				&larr; Back to Home
			</Link>
		</main>
	);
}
