"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";

export default function SignUpPage() {
	const router = useRouter();
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [localError, setLocalError] = useState<string>("");
	const { loading, error: apiError, execute, setError: setApiError } = useApi();
	const toast = useToast();

	const error = localError || apiError;

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLocalError("");
		setApiError(null);

		if (password !== confirmPassword) {
			setLocalError("Passwords do not match.");
			return;
		}

		try {
			await execute("/api/register", {
				method: "POST",
				body: JSON.stringify({ username, password }),
			});

			toast.success("Account created", "Your account is ready. You can sign in now.");
			router.push("/login");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Could not create account. Please try again.";
			toast.error("Signup failed", message);
		}
	};

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200 py-8 sm:py-12">
			<div className="w-full max-w-lg p-6 sm:p-8 lg:p-10 rounded-3xl bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(19,24,29,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative">
				<div className="mb-8 text-center">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 uppercase mb-2">
						Enter the Maze
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Create an account to track your cosmetics.
					</p>
				</div>

				{error && (
					<div className="mb-6 p-3 bg-red-950/50 border border-red-900 text-red-200 text-sm font-medium text-center rounded-xl">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
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

					<div className="space-y-2">
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Password
						</label>
						<input
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-xl focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Confirm Password
						</label>
						<input
							type="password"
							placeholder="••••••••"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={6}
							className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-xl focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-6 group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-neutral-900 text-neutral-100 font-bold text-sm sm:text-base uppercase tracking-[0.14em] border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
					>
						{loading ? "Forging Path..." : "Create Account"}
					</button>
				</form>

				<div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
					<p className="text-sm text-neutral-500">
						Already have an account?{" "}
						<Link
							href="/login"
							className="text-neutral-300 font-bold hover:text-white hover:underline transition-colors"
						>
							Sign In
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
