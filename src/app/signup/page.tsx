"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.message || "An error occurred during registration.",
                );
                setLoading(false);
            } else {
                router.push("/login");
            }
        } catch {
            setError("An unexpected error occurred. Please try again later.");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200 py-12">
            <div className="w-full max-w-md p-8 sm:p-10 bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2">
                        Enter the Maze
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium tracking-wide">
                        Create an account to track your cosmetics.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/50 border border-red-900 text-red-200 text-sm font-medium text-center rounded-sm">
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
                            className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
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
                            className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
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
                            className="w-full bg-neutral-900/50 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-400 focus:bg-neutral-900 transition-all placeholder:text-neutral-600"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 group flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                className="mt-8 text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center gap-2"
            >
                &larr; Back to Home
            </Link>
        </main>
    );
}
