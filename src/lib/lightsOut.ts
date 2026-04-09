export const LIGHTS_OUT_GRID_SIZE = 3;
export const LIGHTS_OUT_NUM_CELLS = LIGHTS_OUT_GRID_SIZE * LIGHTS_OUT_GRID_SIZE;
export const LIGHTS_OUT_ANIMATION_DURATION_MS = 300;

// Toggle a cell and its adjacent neighbors
export const toggleCells = (currentBoard: boolean[], index: number): boolean[] => {
	const newBoard = [...currentBoard];
	const row = Math.floor(index / LIGHTS_OUT_GRID_SIZE);
	const col = index % LIGHTS_OUT_GRID_SIZE;

	// Toggle clicked cell
	newBoard[index] = !newBoard[index];

	// Toggle Top
	if (row > 0)
		newBoard[(row - 1) * LIGHTS_OUT_GRID_SIZE + col] =
			!newBoard[(row - 1) * LIGHTS_OUT_GRID_SIZE + col];
	// Toggle Bottom
	if (row < LIGHTS_OUT_GRID_SIZE - 1)
		newBoard[(row + 1) * LIGHTS_OUT_GRID_SIZE + col] =
			!newBoard[(row + 1) * LIGHTS_OUT_GRID_SIZE + col];
	// Toggle Left
	if (col > 0)
		newBoard[row * LIGHTS_OUT_GRID_SIZE + (col - 1)] =
			!newBoard[row * LIGHTS_OUT_GRID_SIZE + (col - 1)];
	// Toggle Right
	if (col < LIGHTS_OUT_GRID_SIZE - 1)
		newBoard[row * LIGHTS_OUT_GRID_SIZE + (col + 1)] =
			!newBoard[row * LIGHTS_OUT_GRID_SIZE + (col + 1)];

	return newBoard;
};

// Check if the puzzle is solved (all cells are lit)
export const isSolved = (board: boolean[]): boolean => {
	return board.every((cell) => cell);
};

// Generate a random solvable puzzle
export const generateBoard = (): boolean[] => {
	let newBoard = Array(LIGHTS_OUT_NUM_CELLS).fill(true); // Start fully lit

	// Apply random valid moves to scramble
	const numMoves = 10 + Math.floor(Math.random() * 10);
	for (let i = 0; i < numMoves; i++) {
		const randomIdx = Math.floor(Math.random() * LIGHTS_OUT_NUM_CELLS);
		newBoard = toggleCells(newBoard, randomIdx);
	}

	// If it accidentally solved itself, do one more move
	if (isSolved(newBoard)) {
		newBoard = toggleCells(newBoard, Math.floor(Math.random() * LIGHTS_OUT_NUM_CELLS));
	}
	return newBoard;
};
