import {
	PAITINGS_PUZZLE_DRAG_PREFIX,
	PAITINGS_PUZZLE_PAINTING_NAMES,
	PAITINGS_PUZZLE_SLOT_COUNT,
	PAITINGS_PUZZLE_SLOT_PREFIX,
} from "@/constants/paitings-puzzle";

export function getPaintingDragId(paintingName: string) {
	return `${PAITINGS_PUZZLE_DRAG_PREFIX}${paintingName}`;
}

export function getSlotDropId(slotIndex: number) {
	return `${PAITINGS_PUZZLE_SLOT_PREFIX}${slotIndex}`;
}

export function parsePaintingName(dragId: unknown): string | null {
	if (typeof dragId !== "string") return null;
	if (!dragId.startsWith(PAITINGS_PUZZLE_DRAG_PREFIX)) return null;
	const paintingName = dragId.slice(PAITINGS_PUZZLE_DRAG_PREFIX.length);
	if (!PAITINGS_PUZZLE_PAINTING_NAMES.includes(paintingName)) return null;
	return paintingName;
}

export function parseSlotIndex(overId: unknown): number | null {
	if (typeof overId !== "string") return null;
	if (!overId.startsWith(PAITINGS_PUZZLE_SLOT_PREFIX)) return null;
	const rawIndex = overId.slice(PAITINGS_PUZZLE_SLOT_PREFIX.length);
	const index = Number(rawIndex);
	if (!Number.isFinite(index) || !Number.isInteger(index)) return null;
	if (index < 0 || index >= PAITINGS_PUZZLE_SLOT_COUNT) return null;
	return index;
}

export function getPaintingImageSrc(paintingName: string) {
	return `/images/paitings/${encodeURIComponent(`${paintingName}.png`)}`;
}

