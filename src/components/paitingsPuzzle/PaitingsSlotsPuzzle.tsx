"use client";

import {
	DragDropProvider,
	DragOverlay,
	PointerSensor,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/react";
import { useMemo, useState, type ReactNode } from "react";
import {
	PAITINGS_PUZZLE_PAINTING_NAMES,
	PAITINGS_PUZZLE_SLOT_COUNT,
} from "@/constants/paitings-puzzle";
import { parsePaintingName, parseSlotIndex } from "@/lib/paitings-puzzle";
import useCoarsePointer from "@/hooks/useCoarsePointer";
import DroppableSlot from "./DroppableSlot";
import DraggablePaitingCard from "./DraggablePaitingCard";
import PaitingCard from "./PaitingCard";

function SlotRowWrapper({ children }: { children: ReactNode }) {
	return (
		<div className="w-full overflow-x-auto">
			<div className="flex gap-3 flex-nowrap justify-center min-w-max px-1">
				{children}
			</div>
		</div>
	);
}

function TouchPaintingCard({
	paintingName,
	isSelected,
	onSelect,
}: {
	paintingName: string;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className="w-full text-left focus:outline-none"
			aria-pressed={isSelected}
		>
			<PaitingCard
				paintingName={paintingName}
				className={isSelected ? "ring-4 ring-emerald-400/20" : ""}
			/>
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
	function RemoveButton({ onClick }: { onClick: () => void }) {
		return (
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClick();
				}}
				className="w-8 h-8 rounded-full bg-black/65 border border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-400 hover:bg-black/80 transition-colors flex items-center justify-center"
				aria-label="Remove painting"
				title="Remove"
			>
				<span className="text-base leading-none font-black">×</span>
			</button>
		);
	}

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onTapSlot}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onTapSlot();
			}}
			className="w-full text-left focus:outline-none"
			aria-label={`Slot ${slotIndex + 1}`}
		>
			{paintingName ? (
				<PaitingCard
					paintingName={paintingName}
					className={isSelected ? "ring-4 ring-emerald-400/20" : ""}
					actions={<RemoveButton onClick={onClear} />}
				/>
			) : (
				<div className="w-full aspect-square rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950/20 overflow-hidden flex flex-col items-center justify-center relative">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]" />
					<p className="relative text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-500">
						{canPlace ? "Tap to place" : "Drop painting"}
					</p>
					<p className="relative text-[10px] uppercase tracking-[0.14em] font-semibold text-neutral-600 mt-1">
						Slot {slotIndex + 1}
					</p>
				</div>
			)}
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

	const availablePaintings = useMemo(() => {
		const placed = new Set(slots.filter(Boolean) as string[]);
		return PAITINGS_PUZZLE_PAINTING_NAMES.filter((name) => !placed.has(name));
	}, [slots]);

	const activePaintingName = useMemo(
		() => parsePaintingName(activeDragId),
		[activeDragId]
	);

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
		if (emptyIndex === -1) return; // all slots filled => do nothing
		setSlots((prev) => {
			const next = [...prev];
			// Available paintings should not already exist in a slot, but this keeps it consistent.
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

	if (isTouchMode) {
		return (
			<div className="w-full flex flex-col gap-8">
				<SlotRowWrapper>
					{Array.from({ length: PAITINGS_PUZZLE_SLOT_COUNT }, (_, slotIndex) => {
						const paintingName = slots[slotIndex];

						const canPlace = selectedPaintingName != null && paintingName == null;
						const isSelected =
							selectedPaintingName != null && paintingName === selectedPaintingName;

						return (
							<div key={slotIndex} className="flex-none w-20 sm:w-24 md:w-28 lg:w-32">
								<TouchSlotCard
									slotIndex={slotIndex}
									paintingName={paintingName}
									isSelected={isSelected}
									canPlace={canPlace}
									onTapSlot={() => {
										if (paintingName) {
											// Selecting a painting already in a slot.
											if (selectedPaintingName === paintingName) {
												setSelectedPaintingName(null);
												return;
											}

											if (selectedPaintingName && selectedPaintingName !== paintingName) {
												// Move the previously selected painting here.
												movePaintingToSlot(selectedPaintingName, slotIndex);
												return;
											}

											setSelectedPaintingName(paintingName);
											return;
										}

										// Placing onto an empty slot.
										if (!selectedPaintingName) return;
										movePaintingToSlot(selectedPaintingName, slotIndex);
									}}
									onClear={() => {
										if (paintingName && paintingName === selectedPaintingName)
											setSelectedPaintingName(null);
										clearSlot(slotIndex);
									}}
								/>
							</div>
						);
					})}
				</SlotRowWrapper>

				<div className="w-full">
					<h2 className="text-sm uppercase tracking-[0.14em] font-bold text-neutral-300 mb-3">
						Paitings
					</h2>

					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
						{availablePaintings.length === 0 ? (
							<div className="col-span-full text-center py-10 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
								<p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
									All slots filled.
								</p>
								<p className="text-neutral-600 text-[11px] font-semibold mt-2">
									Tap a filled slot to select, then tap another slot to move.
								</p>
							</div>
						) : (
							availablePaintings.map((paintingName) => (
								<div key={paintingName} className="w-full">
									<TouchPaintingCard
										paintingName={paintingName}
										isSelected={false}
										onSelect={() => placeAvailablePainting(paintingName)}
									/>
								</div>
							))
						)}
					</div>
				</div>

				{selectedPaintingName ? (
					<div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">
						Selected: {selectedPaintingName}
					</div>
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

			// Remove painting from any previous slot.
			for (let i = 0; i < next.length; i++) {
				if (next[i] === paintingName) next[i] = null;
			}

			// Overwrite target slot.
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
			<div className="w-full flex flex-col gap-8">
				<SlotRowWrapper>
					{Array.from({ length: PAITINGS_PUZZLE_SLOT_COUNT }, (_, slotIndex) => (
						<div key={slotIndex} className="flex-none w-20 sm:w-24 md:w-28 lg:w-32">
							<DroppableSlot
								slotIndex={slotIndex}
								paintingName={slots[slotIndex]}
								onClearAction={() => clearSlot(slotIndex)}
							/>
						</div>
					))}
				</SlotRowWrapper>

				<div className="w-full">
					<h2 className="text-sm uppercase tracking-[0.14em] font-bold text-neutral-300 mb-3">
						Paitings
					</h2>

					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
						{availablePaintings.length === 0 ? (
							<div className="col-span-full text-center py-10 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
								<p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
									All slots filled.
								</p>
								<p className="text-neutral-600 text-[11px] font-semibold mt-2">
									Use the × button to remove, or drag between slots to rearrange.
								</p>
							</div>
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
				</div>
			</div>

			<DragOverlay>
				{activePaintingName ? (
					<div className="w-20 sm:w-24 md:w-28 lg:w-32">
						<PaitingCard
							paintingName={activePaintingName}
							isGhost
							className="pointer-events-none opacity-90"
						/>
					</div>
				) : null}
			</DragOverlay>
		</DragDropProvider>
	);
}
