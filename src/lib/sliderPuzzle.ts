// Constants
export const GRID_SIZE = 3;
export const NUM_TILES = GRID_SIZE * GRID_SIZE;
export const TILE_SIZE = 100; // pixels, used for smooth animation
export const ANIMATION_DURATION_MS = 300;

// Get the solved state of the puzzle
export const getSolvedState = (): number[] => {
	const state = Array.from({ length: NUM_TILES - 1 }, (_, i) => i + 1);
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
	const row = Math.floor(index / GRID_SIZE);
	const col = index % GRID_SIZE;

	if (row > 0) moves.push(index - GRID_SIZE); // Up
	if (row < GRID_SIZE - 1) moves.push(index + GRID_SIZE); // Down
	if (col > 0) moves.push(index - 1); // Left
	if (col < GRID_SIZE - 1) moves.push(index + 1); // Right

	return moves;
};

// Check if two tile indices are adjacent
export const isAdjacent = (index1: number, index2: number): boolean => {
	const row1 = Math.floor(index1 / GRID_SIZE);
	const col1 = index1 % GRID_SIZE;
	const row2 = Math.floor(index2 / GRID_SIZE);
	const col2 = index2 % GRID_SIZE;

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
