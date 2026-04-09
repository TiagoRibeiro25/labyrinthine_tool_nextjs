interface LightsOutCellProps {
	isLit: boolean;
	isAnimating: boolean;
	isWon: boolean;
	onClick: () => void;
}

export function LightsOutCell({
	isLit,
	isAnimating,
	isWon,
	onClick,
}: LightsOutCellProps) {
	return (
		<button
			onClick={onClick}
			disabled={isWon}
			className={`
				w-full h-full rounded-lg shadow-inner transition-all duration-300 transform active:scale-95
				${isAnimating ? "cell-toggled" : ""}
				${
					isLit
						? "bg-amber-300 shadow-[0_0_15px_rgba(252,211,77,0.6)] border-2 border-amber-100 hover:shadow-[0_0_25px_rgba(252,211,77,0.8)] hover:bg-amber-200"
						: "bg-neutral-900 border-2 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700"
				}
				${isWon ? "cursor-default" : "cursor-pointer"}
			`}
			aria-label={`Toggle cell ${isLit ? "on" : "off"}`}
		/>
	);
}
