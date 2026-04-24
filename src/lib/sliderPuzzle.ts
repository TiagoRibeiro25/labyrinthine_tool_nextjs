import {
	SLIDER_PUZZLE_GRID_SIZE,
	SLIDER_PUZZLE_NUM_TILES,
} from "../constants/slider-puzzle";

// Get the solved state of the puzzle
export const getSolvedState = (): number[] => {
	const state = Array.from(
		{ length: SLIDER_PUZZLE_NUM_TILES - 1 },
		(_, i) => i + 1
	);
	state.push(0); // 0 represents the empty tile
	return state;
};

// Check if the current tiles match the solved state
export const checkSolved = (currentTiles: number[]): boolean => {
	const solved = getSolvedState();
	for (let i = 0; i < currentTiles.length; i++) {
		if (currentTiles[i] !== solved[i]) return false;
	}
	return true;
};

// Get valid adjacent moves for a tile at given index
export const getValidAdjacentMoves = (index: number): number[] => {
	const moves = [];
	const row = Math.floor(index / SLIDER_PUZZLE_GRID_SIZE);
	const col = index % SLIDER_PUZZLE_GRID_SIZE;

	if (row > 0) moves.push(index - SLIDER_PUZZLE_GRID_SIZE); // Up
	if (row < SLIDER_PUZZLE_GRID_SIZE - 1)
		moves.push(index + SLIDER_PUZZLE_GRID_SIZE); // Down
	if (col > 0) moves.push(index - 1); // Left
	if (col < SLIDER_PUZZLE_GRID_SIZE - 1) moves.push(index + 1); // Right

	return moves;
};

// Check if two tile indices are adjacent
export const isAdjacent = (index1: number, index2: number): boolean => {
	const row1 = Math.floor(index1 / SLIDER_PUZZLE_GRID_SIZE);
	const col1 = index1 % SLIDER_PUZZLE_GRID_SIZE;
	const row2 = Math.floor(index2 / SLIDER_PUZZLE_GRID_SIZE);
	const col2 = index2 % SLIDER_PUZZLE_GRID_SIZE;

	return (
		(Math.abs(row1 - row2) === 1 && col1 === col2) ||
		(Math.abs(col1 - col2) === 1 && row1 === row2)
	);
};

// Shuffle puzzle using valid moves to ensure solvability
export const shufflePuzzle = (numShuffles: number = 100): number[] => {
	const tiles = [...getSolvedState()];
	let emptyIndex = tiles.indexOf(0);

	for (let i = 0; i < numShuffles; i++) {
		const validMoves = getValidAdjacentMoves(emptyIndex);
		const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

		// Swap
		tiles[emptyIndex] = tiles[randomMove];
		tiles[randomMove] = 0;
		emptyIndex = randomMove;
	}

	return tiles;
};
