import { LightsOutCell } from "./LightsOutCell";

interface LightsOutBoardProps {
	board: boolean[];
	animatingCells: Set<number>;
	isWon: boolean;
	onCellClick: (index: number) => void;
}

export function LightsOutBoard({
	board,
	animatingCells,
	isWon,
	onCellClick,
}: LightsOutBoardProps) {
	return (
		<div
			className={`grid grid-cols-3 gap-2 sm:gap-3 mb-8 w-full max-w-75 aspect-square border-2 rounded-lg p-2 transition-all duration-300 ${isWon ? "board-won" : "border-transparent"}`}
		>
			{board.map((isLit, index) => (
				<LightsOutCell
					key={index}
					isLit={isLit}
					isAnimating={animatingCells.has(index)}
					isWon={isWon}
					onClick={() => onCellClick(index)}
				/>
			))}
		</div>
	);
}
