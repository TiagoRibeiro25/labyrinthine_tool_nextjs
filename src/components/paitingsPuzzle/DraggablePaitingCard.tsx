"use client";

import { useDraggable } from "@dnd-kit/react";
import { getPaintingDragId } from "@/lib/paitings-puzzle";
import PaitingCard from "./PaitingCard";

export default function DraggablePaitingCard({
	paintingName,
	actions,
	onClick,
	variant = "default",
}: {
	paintingName: string;
	actions?: React.ReactNode;
	onClick?: () => void;
	variant?: "default" | "frame";
}) {
	const { ref: draggableRef, isDragging } = useDraggable({
		id: getPaintingDragId(paintingName),
	});

	return (
		<div
			ref={(node) => draggableRef(node)}
			className={onClick ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
			style={{ opacity: isDragging ? 0.4 : 1 }}
			onClick={onClick}
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			onKeyDown={
				onClick
					? (e) => {
							if (e.key === "Enter" || e.key === " ") onClick();
						}
					: undefined
			}
		>
			<PaitingCard
				paintingName={paintingName}
				isGhost={isDragging}
				actions={actions}
				variant={variant}
			/>
		</div>
	);
}
