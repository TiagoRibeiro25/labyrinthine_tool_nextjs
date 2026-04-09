"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

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

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-md p-8 sm:p-10 bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
				<div className="mb-8 text-center">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2">
						Return to the Fog
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Sign in to access your cosmetics tracker.
					</p>
				</div>

				{error && (
					<div className="mb-6 p-3 bg-red-950/50 border border-red-900 text-red-200 text-sm font-medium text-center rounded-sm">
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
							className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
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
							className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-4 group flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
					>
						{loading ? "Entering..." : "Sign In"}
					</button>
				</form>

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
				className="mt-8 text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center gap-2"
			>
				&larr; Back to Home
			</Link>
		</main>
	);
}
