"use client";

import {
	DragDropProvider,
	DragOverlay,
	PointerSensor,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/react";
import { useMemo, useState, type ReactNode } from "react";
import { FaRotateLeft } from "react-icons/fa6";
import {
	PAITINGS_PUZZLE_PAINTING_NAMES,
	PAITINGS_PUZZLE_SLOT_COUNT,
} from "@/constants/paitings-puzzle";
import useCoarsePointer from "@/hooks/useCoarsePointer";
import { parsePaintingName, parseSlotIndex } from "@/lib/paitings-puzzle";
import DroppableSlot from "./DroppableSlot";
import DraggablePaitingCard from "./DraggablePaitingCard";
import PaitingCard from "./PaitingCard";

function ExhibitionGrid({ children }: { children: ReactNode }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>
	);
}

function RemoveButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-black/70 text-neutral-200 transition-colors hover:border-neutral-400 hover:bg-black/90 hover:text-white"
			aria-label="Remove painting"
			title="Remove"
		>
			<span className="text-base leading-none font-black">×</span>
		</button>
	);
}

function TouchPaintingCard({
	paintingName,
	onSelect,
}: {
	paintingName: string;
	onSelect: () => void;
}) {
	return (
		<button type="button" onClick={onSelect} className="w-full text-left focus:outline-none">
			<PaitingCard paintingName={paintingName} />
		</button>
	);
}

function TouchSlotCard({
	slotIndex,
	paintingName,
	isSelected,
	canPlace,
	onTapSlot,
	onClear,
}: {
	slotIndex: number;
	paintingName: string | null;
	isSelected: boolean;
	canPlace: boolean;
	onTapSlot: () => void;
	onClear: () => void;
}) {
	return (
		<div className="relative w-full">
			<span className="pointer-events-none absolute -top-2 left-3 z-20 rounded-full border border-amber-800/60 bg-black/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/90">
				Frame {slotIndex + 1}
			</span>

			<div
				role="button"
				tabIndex={0}
				onClick={onTapSlot}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") onTapSlot();
				}}
				className="w-full text-left focus:outline-none"
				aria-label={`Frame ${slotIndex + 1}`}
			>
				{paintingName ? (
					<PaitingCard
						paintingName={paintingName}
						variant="frame"
						className={isSelected ? "ring-4 ring-amber-400/25" : ""}
						actions={<RemoveButton onClick={onClear} />}
					/>
				) : (
					<div
						className={`relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-[linear-gradient(160deg,rgba(12,10,8,0.9),rgba(20,16,12,0.75))] ${
							canPlace
								? "border-amber-400/50 ring-4 ring-amber-400/15"
								: "border-amber-900/35"
						}`}
					>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.1),transparent_60%)]"
						/>
						<p className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/80">
							{canPlace ? "Tap to place" : "Empty frame"}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

function PuzzleProgress({
	filledCount,
	onReset,
}: {
	filledCount: number;
	onReset: () => void;
}) {
	const isComplete = filledCount === PAITINGS_PUZZLE_SLOT_COUNT;

	return (
		<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-3">
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
						Recorded order
					</p>
					<p className="text-sm font-black tabular-nums text-neutral-200">
						{filledCount}
						<span className="text-neutral-600"> / {PAITINGS_PUZZLE_SLOT_COUNT}</span>
					</p>
				</div>
				<div className="mt-2 h-1.5 overflow-hidden rounded-full border border-neutral-800 bg-black/50">
					<div
						className={`h-full rounded-full transition-all duration-500 ${
							isComplete
								? "bg-linear-to-r from-amber-500 to-amber-300"
								: "bg-linear-to-r from-amber-700 to-amber-500"
						}`}
						style={{
							width: `${(filledCount / PAITINGS_PUZZLE_SLOT_COUNT) * 100}%`,
						}}
					/>
				</div>
				<p className="mt-2 text-xs text-neutral-500">
					{isComplete
						? "Full order saved, match Frame 1 through 4 on the Manor wall in-game."
						: `Add ${PAITINGS_PUZZLE_SLOT_COUNT - filledCount} more portrait${PAITINGS_PUZZLE_SLOT_COUNT - filledCount === 1 ? "" : "s"} to complete the sequence.`}
				</p>
			</div>

			<button
				type="button"
				onClick={onReset}
				disabled={filledCount === 0}
				className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-700 bg-black/40 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-300 transition-all duration-300 hover:border-neutral-500 hover:bg-neutral-900 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
			>
				<FaRotateLeft className="h-3.5 w-3.5" />
				Clear order
			</button>
		</div>
	);
}

function ExhibitionPanel({ children }: { children: ReactNode }) {
	return (
		<section className="rounded-2xl border border-amber-900/30 bg-black/35 p-4 sm:p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-black uppercase tracking-[0.14em] text-amber-100/90">
						Your Manor order
					</h2>
					<p className="mt-1 text-xs text-neutral-500">Frame 1 → 4 · left to right on the wall</p>
				</div>
				<span className="rounded-full border border-amber-800/50 bg-amber-950/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300/90">
					Slots
				</span>
			</div>
			{children}
		</section>
	);
}

function CollectionPanel({
	children,
	availableCount,
}: {
	children: ReactNode;
	availableCount: number;
}) {
	return (
		<section className="rounded-2xl border border-neutral-800 bg-black/35 p-4 sm:p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-100">
						Remaining portraits
					</h2>
					<p className="mt-1 text-xs text-neutral-500">
						{availableCount} not in your order · {PAITINGS_PUZZLE_PAINTING_NAMES.length} in
						the puzzle pool
					</p>
				</div>
				<span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
					Archive
				</span>
			</div>
			{children}
		</section>
	);
}

function EmptyCollectionMessage({ touchMode }: { touchMode: boolean }) {
	return (
		<div className="col-span-full rounded-xl border border-dashed border-neutral-700 bg-black/25 px-4 py-10 text-center">
			<p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
				All four slots filled
			</p>
			<p className="mt-2 text-[11px] font-medium text-neutral-600">
				{touchMode
					? "Tap a portrait in your order to adjust it, or tap another frame to swap positions."
					: "Use × to remove a portrait from your order, or drag between frames to fix the sequence."}
			</p>
		</div>
	);
}

export default function PaitingsSlotsPuzzle() {
	const [slots, setSlots] = useState<Array<string | null>>(() =>
		Array.from({ length: PAITINGS_PUZZLE_SLOT_COUNT }, () => null)
	);
	const [activeDragId, setActiveDragId] = useState<string | null>(null);
	const [selectedPaintingName, setSelectedPaintingName] = useState<string | null>(null);
	const isTouchMode = useCoarsePointer();

	const filledCount = useMemo(() => slots.filter(Boolean).length, [slots]);

	const availablePaintings = useMemo(() => {
		const placed = new Set(slots.filter(Boolean) as string[]);
		return PAITINGS_PUZZLE_PAINTING_NAMES.filter((name) => !placed.has(name));
	}, [slots]);

	const activePaintingName = useMemo(
		() => parsePaintingName(activeDragId),
		[activeDragId]
	);

	function resetWall() {
		setSlots(Array.from({ length: PAITINGS_PUZZLE_SLOT_COUNT }, () => null));
		setSelectedPaintingName(null);
	}

	function clearSlot(slotIndex: number) {
		setSlots((prev) => {
			const next = [...prev];
			next[slotIndex] = null;
			return next;
		});
	}

	function movePaintingToSlot(paintingName: string, slotIndex: number) {
		setSlots((prev) => {
			const next = [...prev];
			for (let i = 0; i < next.length; i++) {
				if (next[i] === paintingName) next[i] = null;
			}
			next[slotIndex] = paintingName;
			return next;
		});
		setSelectedPaintingName(null);
	}

	function placeAvailablePainting(paintingName: string, markAsSelected = true) {
		const emptyIndex = slots.findIndex((slot) => slot === null);
		if (emptyIndex === -1) return;
		setSlots((prev) => {
			const next = [...prev];
			for (let i = 0; i < next.length; i++) {
				if (next[i] === paintingName) next[i] = null;
			}
			next[emptyIndex] = paintingName;
			return next;
		});
		if (markAsSelected) {
			setSelectedPaintingName(paintingName);
		}
	}

	const progress = (
		<PuzzleProgress filledCount={filledCount} onReset={resetWall} />
	);

	if (isTouchMode) {
		return (
			<div className="flex w-full flex-col gap-5">
				{progress}

				<ExhibitionPanel>
					<ExhibitionGrid>
						{Array.from({ length: PAITINGS_PUZZLE_SLOT_COUNT }, (_, slotIndex) => {
							const paintingName = slots[slotIndex];
							const canPlace = selectedPaintingName != null && paintingName == null;
							const isSelected =
								selectedPaintingName != null && paintingName === selectedPaintingName;

							return (
								<TouchSlotCard
									key={slotIndex}
									slotIndex={slotIndex}
									paintingName={paintingName}
									isSelected={isSelected}
									canPlace={canPlace}
									onTapSlot={() => {
										if (paintingName) {
											if (selectedPaintingName === paintingName) {
												setSelectedPaintingName(null);
												return;
											}

											if (selectedPaintingName && selectedPaintingName !== paintingName) {
												movePaintingToSlot(selectedPaintingName, slotIndex);
												return;
											}

											setSelectedPaintingName(paintingName);
											return;
										}

										if (!selectedPaintingName) return;
										movePaintingToSlot(selectedPaintingName, slotIndex);
									}}
									onClear={() => {
										if (paintingName && paintingName === selectedPaintingName) {
											setSelectedPaintingName(null);
										}
										clearSlot(slotIndex);
									}}
								/>
							);
						})}
					</ExhibitionGrid>
				</ExhibitionPanel>

				<CollectionPanel availableCount={availablePaintings.length}>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{availablePaintings.length === 0 ? (
							<EmptyCollectionMessage touchMode />
						) : (
							availablePaintings.map((paintingName) => (
								<TouchPaintingCard
									key={paintingName}
									paintingName={paintingName}
									onSelect={() => placeAvailablePainting(paintingName)}
								/>
							))
						)}
					</div>
				</CollectionPanel>

				{selectedPaintingName ? (
					<p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
						Selected: {selectedPaintingName}
					</p>
				) : null}
			</div>
		);
	}

	function onDragEnd(event: DragEndEvent) {
		setActiveDragId(null);
		if (event.canceled) return;

		const targetId = event.operation.target?.id;
		const paintingName = parsePaintingName(event.operation.source?.id);
		if (!paintingName) return;

		const slotIndex = parseSlotIndex(targetId);
		if (slotIndex === null) return;

		setSlots((prev) => {
			const next = [...prev];
			for (let i = 0; i < next.length; i++) {
				if (next[i] === paintingName) next[i] = null;
			}
			next[slotIndex] = paintingName;
			return next;
		});
	}

	return (
		<DragDropProvider
			sensors={[PointerSensor]}
			onDragEnd={onDragEnd}
			onDragStart={(event: DragStartEvent) => {
				const sourceId = event.operation.source?.id;
				setActiveDragId(typeof sourceId === "string" ? sourceId : null);
			}}
		>
			<div className="flex w-full flex-col gap-5">
				{progress}

				<ExhibitionPanel>
					<ExhibitionGrid>
						{Array.from({ length: PAITINGS_PUZZLE_SLOT_COUNT }, (_, slotIndex) => (
							<DroppableSlot
								key={slotIndex}
								slotIndex={slotIndex}
								paintingName={slots[slotIndex]}
								onClearAction={() => clearSlot(slotIndex)}
							/>
						))}
					</ExhibitionGrid>
				</ExhibitionPanel>

				<CollectionPanel availableCount={availablePaintings.length}>
					<div className="grid max-h-[min(52vh,28rem)] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:max-h-[min(46vh,24rem)]">
						{availablePaintings.length === 0 ? (
							<EmptyCollectionMessage touchMode={false} />
						) : (
							availablePaintings.map((paintingName) => (
								<DraggablePaitingCard
									key={paintingName}
									paintingName={paintingName}
									onClick={() => placeAvailablePainting(paintingName, false)}
								/>
							))
						)}
					</div>
				</CollectionPanel>
			</div>

			<DragOverlay>
				{activePaintingName ? (
					<div className="w-28 sm:w-32">
						<PaitingCard
							paintingName={activePaintingName}
							isGhost
							className="pointer-events-none rotate-2 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
						/>
					</div>
				) : null}
			</DragOverlay>
		</DragDropProvider>
	);
}
