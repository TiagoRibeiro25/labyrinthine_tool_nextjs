"use client";

import { useDroppable } from "@dnd-kit/react";
import { getSlotDropId } from "@/lib/paitings-puzzle";
import DraggablePaitingCard from "./DraggablePaitingCard";

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

export default function DroppableSlot({
	slotIndex,
	paintingName,
	onClear,
}: {
	slotIndex: number;
	paintingName: string | null;
	onClear: () => void;
}) {
	const { ref: droppableRef, isDropTarget } = useDroppable({
		id: getSlotDropId(slotIndex),
	});

	return (
		<div
			ref={(node) => droppableRef(node)}
			className={`relative w-full rounded-2xl transition-all duration-200 ${
				isDropTarget ? "ring-4 ring-amber-400/20" : ""
			}`}
		>
			{paintingName ? (
				<DraggablePaitingCard
					paintingName={paintingName}
					actions={<RemoveButton onClick={onClear} />}
				/>
			) : (
				<div className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950/20 overflow-hidden flex flex-col items-center justify-center">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]" />
					<p className="relative text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-500">
						Drop painting
					</p>
					<p className="relative text-[10px] uppercase tracking-[0.14em] font-semibold text-neutral-600 mt-1">
						Slot {slotIndex + 1}
					</p>
				</div>
			)}
		</div>
	);
}
