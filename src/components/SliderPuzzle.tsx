"use client";

import React, { useState, useCallback } from "react";

const GRID_SIZE = 3;
const NUM_TILES = GRID_SIZE * GRID_SIZE;

const getSolvedState = () => {
    const state = Array.from({ length: NUM_TILES - 1 }, (_, i) => i + 1);
    state.push(0); // 0 represents the empty tile
    return state;
};

export default function SliderPuzzle() {
    const [tiles, setTiles] = useState<number[]>(getSolvedState());
    const [isSolved, setIsSolved] = useState<boolean>(true);
    const [moves, setMoves] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const checkSolved = useCallback((currentTiles: number[]) => {
        const solved = getSolvedState();
        for (let i = 0; i < currentTiles.length; i++) {
            if (currentTiles[i] !== solved[i]) return false;
        }
        return true;
    }, []);

    const shufflePuzzle = () => {
        // To ensure solvability, we simulate random valid moves rather than randomizing the array
        const currentTiles = [...getSolvedState()];
        let emptyIndex = currentTiles.indexOf(0);

        // Make 100 random valid moves to shuffle
        for (let i = 0; i < 100; i++) {
            const validMoves = [];
            const row = Math.floor(emptyIndex / GRID_SIZE);
            const col = emptyIndex % GRID_SIZE;

            if (row > 0) validMoves.push(emptyIndex - GRID_SIZE); // Up
            if (row < GRID_SIZE - 1) validMoves.push(emptyIndex + GRID_SIZE); // Down
            if (col > 0) validMoves.push(emptyIndex - 1); // Left
            if (col < GRID_SIZE - 1) validMoves.push(emptyIndex + 1); // Right

            const randomMove =
                validMoves[Math.floor(Math.random() * validMoves.length)];

            // Swap
            currentTiles[emptyIndex] = currentTiles[randomMove];
            currentTiles[randomMove] = 0;
            emptyIndex = randomMove;
        }

        setTiles(currentTiles);
        setMoves(0);
        setIsSolved(false);
        setIsPlaying(true);
    };

    const handleTileClick = (index: number) => {
        if (!isPlaying || isSolved) return;

        const emptyIndex = tiles.indexOf(0);
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
        const emptyCol = emptyIndex % GRID_SIZE;

        // Check if adjacent (not diagonal)
        const isAdjacent =
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);

        if (isAdjacent) {
            const newTiles = [...tiles];
            newTiles[emptyIndex] = newTiles[index];
            newTiles[index] = 0;

            setTiles(newTiles);
            setMoves((m) => m + 1);

            if (checkSolved(newTiles)) {
                setIsSolved(true);
                setIsPlaying(false);
            }
        }
    };

    return (
        <div className="flex flex-col items-center p-6 bg-black/60 border border-neutral-800 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-md w-full mx-auto">
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-500 uppercase mb-6">
                Slider Puzzle
            </h2>

            <div className="flex justify-between w-full mb-4 px-2 text-neutral-400 font-mono text-sm tracking-wider">
                <span>MOVES: {moves}</span>
                <span>
                    {isSolved && moves > 0
                        ? "SOLVED!"
                        : isPlaying
                          ? "PLAYING"
                          : "WAITING"}
                </span>
            </div>

            <div
                className="grid gap-1 bg-neutral-900 p-2 rounded-sm border border-neutral-700 shadow-inner"
                style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                }}
            >
                {tiles.map((tile, index) => (
                    <div
                        key={index}
                        onClick={() => handleTileClick(index)}
                        className={`
                            relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 text-2xl font-bold rounded-sm select-none transition-all duration-200
                            ${
                                tile === 0
                                    ? "bg-transparent border border-neutral-800/50 cursor-default"
                                    : "bg-neutral-800 border border-neutral-600 text-neutral-300 cursor-pointer hover:bg-neutral-700 hover:border-neutral-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            }
                            ${!isPlaying && tile !== 0 && !isSolved ? "opacity-50 grayscale" : ""}
                            ${isSolved && tile !== 0 ? "bg-neutral-800/80 border-green-900/50 text-neutral-500" : ""}
                        `}
                    >
                        {tile !== 0 && (
                            <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                {tile}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={shufflePuzzle}
                className="mt-8 px-8 py-3 w-full rounded-sm bg-neutral-900 text-neutral-100 font-bold uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
                {isPlaying ? "Restart Puzzle" : "Start Practice"}
            </button>

            {isSolved && moves > 0 && (
                <div className="mt-6 p-4 w-full bg-green-950/30 border border-green-900/50 rounded-sm text-center">
                    <p className="text-green-400 font-medium tracking-wide animate-pulse">
                        Puzzle Solved in {moves} moves!
                    </p>
                </div>
            )}
        </div>
    );
}
