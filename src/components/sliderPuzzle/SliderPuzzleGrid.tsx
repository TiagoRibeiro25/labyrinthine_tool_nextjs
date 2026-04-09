import { SliderPuzzleTile } from "./SliderPuzzleTile";

const GRID_SIZE = 3;

interface SliderPuzzleGridProps {
	tiles: number[];
	animatingTiles: Set<number>;
	isPlaying: boolean;
	isSolved: boolean;
	onTileClick: (index: number) => void;
}

export function SliderPuzzleGrid({
	tiles,
	animatingTiles,
	isPlaying,
	isSolved,
	onTileClick,
}: SliderPuzzleGridProps) {
	return (
		<div
			className="grid gap-2 bg-neutral-900/80 p-3 rounded-lg border border-neutral-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] backdrop-blur-sm"
			style={{
				gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
			}}
		>
			{tiles.map((tile, index) => (
				<SliderPuzzleTile
					key={index}
					tile={tile}
					index={index}
					isAnimating={animatingTiles.has(index)}
					isPlaying={isPlaying}
					isSolved={isSolved}
					onClick={onTileClick}
				/>
			))}
		</div>
	);
}
