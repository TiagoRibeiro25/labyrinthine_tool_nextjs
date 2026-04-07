export default function Loading() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-6">
				<div className="relative flex h-16 w-16 items-center justify-center">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-500 opacity-20"></span>
					<span className="relative inline-flex h-12 w-12 rounded-full bg-neutral-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"></span>
				</div>
				<p className="text-sm font-semibold tracking-[0.2em] text-neutral-300 uppercase animate-pulse">
					Loading
				</p>
			</div>
		</div>
	);
}
