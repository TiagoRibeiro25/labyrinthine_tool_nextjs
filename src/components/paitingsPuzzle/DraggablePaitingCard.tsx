"use client";

import { useDraggable } from "@dnd-kit/react";
import { getPaintingDragId } from "@/lib/paitings-puzzle";
import PaitingCard from "./PaitingCard";

export default function DraggablePaitingCard({
	paintingName,
	actions,
}: {
	paintingName: string;
	actions?: React.ReactNode;
}) {
	const { ref: draggableRef, isDragging } = useDraggable({
		id: getPaintingDragId(paintingName),
	});

	return (
		<div ref={(node) => draggableRef(node)} style={{ opacity: isDragging ? 0.85 : 1 }}>
			<PaitingCard paintingName={paintingName} isGhost={isDragging} actions={actions} />
		</div>
	);
}

