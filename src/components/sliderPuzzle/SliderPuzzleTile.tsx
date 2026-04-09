interface SliderPuzzleTileProps {
	tile: number;
	index: number;
	isAnimating: boolean;
	isPlaying: boolean;
	isSolved: boolean;
	onClick: (index: number) => void;
}

export function SliderPuzzleTile({
	tile,
	index,
	isAnimating,
	isPlaying,
	isSolved,
	onClick,
}: SliderPuzzleTileProps) {
	return (
		<div
			onClick={() => onClick(index)}
			className={`
				relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 text-2xl font-bold rounded-lg select-none
				transition-all duration-300 ease-out cursor-pointer
				${isAnimating ? "tile-animated" : ""}
				${
					tile === 0
						? "bg-transparent border border-dashed border-neutral-700/50 cursor-default hover:border-neutral-600/70"
						: `
								${
									isPlaying && !isSolved
										? "bg-linear-to-br from-neutral-700 to-neutral-800 border border-neutral-600 text-neutral-200 hover:from-neutral-600 hover:to-neutral-700 hover:border-neutral-400 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] active:scale-95"
										: "bg-neutral-800/80 border border-green-900/80 text-neutral-500"
								}
							`
				}
				${!isPlaying && tile !== 0 && !isSolved ? "opacity-40 grayscale" : ""}
			`}
		>
			{tile !== 0 && (
				<span className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.9)]">{tile}</span>
			)}
		</div>
	);
}
