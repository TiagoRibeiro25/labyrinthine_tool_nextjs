"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface OnboardingPreviewResponse {
	discordDisplayName: string;
	preferredAccountUsername: string;
	discordAvatarUrl: string | null;
}

interface OnboardingCompleteResponse {
	message: string;
	loginToken: string;
}

async function parseErrorMessage(response: Response, fallback: string) {
	try {
		const data = (await response.json()) as { message?: string };
		return data.message || fallback;
	} catch {
		return fallback;
	}
}

export default function DiscordSignUpPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

	const [isLoadingPreview, setIsLoadingPreview] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [discordDisplayName, setDiscordDisplayName] = useState("");
	const [preferredUsername, setPreferredUsername] = useState("");
	const [customUsername, setCustomUsername] = useState("");
	const [showCustomUsernameInput, setShowCustomUsernameInput] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const loadPreview = async () => {
			if (!token) {
				setError("Discord onboarding session is missing.");
				setIsLoadingPreview(false);
				return;
			}

			setIsLoadingPreview(true);
			setError("");

			try {
				const response = await fetch(
					`/api/auth/discord/onboarding?token=${encodeURIComponent(token)}`,
					{
						method: "GET",
						cache: "no-store",
					}
				);

				if (!response.ok) {
					const message = await parseErrorMessage(
						response,
						"Could not load Discord onboarding details."
					);
					throw new Error(message);
				}

				const data = (await response.json()) as OnboardingPreviewResponse;

				if (!cancelled) {
					setDiscordDisplayName(data.discordDisplayName);
					setPreferredUsername(data.preferredAccountUsername);
					setCustomUsername(data.preferredAccountUsername);
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err.message
							: "Could not load Discord onboarding details."
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoadingPreview(false);
				}
			}
		};

		void loadPreview();

		return () => {
			cancelled = true;
		};
	}, [token]);

	const completeSignup = async (username?: string) => {
		if (!token) {
			setError("Discord onboarding session is missing.");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch("/api/auth/discord/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					...(username ? { username } : {}),
				}),
			});

			if (!response.ok) {
				const message = await parseErrorMessage(
					response,
					"Could not create your account with Discord."
				);

				if (response.status === 409) {
					setShowCustomUsernameInput(true);
				}

				throw new Error(message);
			}

			const data = (await response.json()) as OnboardingCompleteResponse;

			const signInResult = await signIn("discord-token", {
				token: data.loginToken,
				redirect: false,
			});

			if (signInResult?.error) {
				throw new Error("Account was created, but sign-in failed. Please try again.");
			}

			router.push("/dashboard");
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Could not create your account with Discord."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUseDiscordUsername = async () => {
		await completeSignup(preferredUsername);
	};

	const handleCustomUsernameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await completeSignup(customUsername);
	};

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-lg p-6 sm:p-8 lg:p-10 rounded-3xl bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(19,24,29,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative">
				<div className="mb-8 text-center">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 uppercase mb-2">
						Discord Sign Up
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Finish setting up your account.
					</p>
				</div>

				{(isLoadingPreview || isSubmitting) && (
					<div className="mb-6 p-3 bg-neutral-900/80 border border-neutral-700 text-neutral-300 text-sm font-medium text-center rounded-xl">
						{isLoadingPreview ? "Loading Discord info..." : "Creating account..."}
					</div>
				)}

				{error && (
					<div className="mb-6 p-3 bg-red-950/50 border border-red-900 text-red-200 text-sm font-medium text-center rounded-xl">
						{error}
					</div>
				)}

				{!isLoadingPreview && !error && (
					<div className="space-y-5">
						<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
							<p className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">
								Discord account
							</p>
							<p className="text-sm text-neutral-200 font-semibold">
								{discordDisplayName}
							</p>
						</div>

						<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
							<p className="text-sm text-neutral-300">
								Use your Discord username as your account username?
							</p>
							<p className="mt-2 text-lg font-black text-neutral-100 tracking-wide">
								{preferredUsername}
							</p>

							<div className="mt-4 flex flex-col sm:flex-row gap-3">
								<button
									type="button"
									onClick={handleUseDiscordUsername}
									disabled={isSubmitting}
									className="flex-1 px-4 py-3 rounded-full bg-neutral-900 text-neutral-100 font-bold text-xs uppercase tracking-[0.14em] border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
								>
									Use Discord Username
								</button>
								<button
									type="button"
									onClick={() => setShowCustomUsernameInput(true)}
									disabled={isSubmitting}
									className="flex-1 px-4 py-3 rounded-full bg-neutral-950 text-neutral-200 font-bold text-xs uppercase tracking-[0.14em] border border-neutral-700 hover:bg-neutral-900 hover:border-neutral-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
								>
									Choose Another
								</button>
							</div>
						</div>
					</div>
				)}

				{!isLoadingPreview && showCustomUsernameInput && (
					<form onSubmit={handleCustomUsernameSubmit} className="space-y-4 mt-5">
						<div className="space-y-2">
							<label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
								Account Username
							</label>
							<input
								type="text"
								placeholder="Survivor"
								value={customUsername}
								onChange={(e) => setCustomUsername(e.target.value)}
								required
								minLength={3}
								maxLength={32}
								className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-xl focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
							/>
							<p className="text-[11px] text-neutral-500">
								Allowed: letters, numbers, underscores, and hyphens.
							</p>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full mt-2 px-8 py-4 rounded-full bg-neutral-900 text-neutral-100 font-bold text-sm uppercase tracking-[0.14em] border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{isSubmitting ? "Creating..." : "Create Account"}
						</button>
					</form>
				)}

				<div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
					<p className="text-sm text-neutral-500">
						Changed your mind?{" "}
						<Link
							href="/login"
							className="text-neutral-300 font-bold hover:text-white hover:underline transition-colors"
						>
							Back to Login
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}