"use client";

import { useDroppable } from "@dnd-kit/react";
import { getSlotDropId } from "@/lib/paitings-puzzle";
import { FaImage } from "react-icons/fa6";
import DraggablePaitingCard from "./DraggablePaitingCard";

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

export default function DroppableSlot({
	slotIndex,
	paintingName,
	onClearAction,
}: {
	slotIndex: number;
	paintingName: string | null;
	onClearAction: () => void;
}) {
	const { ref: droppableRef, isDropTarget } = useDroppable({
		id: getSlotDropId(slotIndex),
	});

	return (
		<div
			ref={(node) => droppableRef(node)}
			className={`relative w-full rounded-xl transition-all duration-200 ${
				isDropTarget ? "ring-4 ring-amber-400/25 scale-[1.02]" : ""
			}`}
		>
			<span className="pointer-events-none absolute -top-2 left-3 z-20 rounded-full border border-amber-800/60 bg-black/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/90">
				Frame {slotIndex + 1}
			</span>

			{paintingName ? (
				<DraggablePaitingCard
					paintingName={paintingName}
					variant="frame"
					actions={<RemoveButton onClick={onClearAction} />}
				/>
			) : (
				<div className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-amber-900/35 bg-[linear-gradient(160deg,rgba(12,10,8,0.9),rgba(20,16,12,0.75))]">
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.08),transparent_60%)]"
					/>
					<FaImage className="relative mb-2 h-6 w-6 text-amber-700/80" />
					<p className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/70">
						Drop portrait
					</p>
					<p className="relative mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
						Empty frame
					</p>
				</div>
			)}
		</div>
	);
}
