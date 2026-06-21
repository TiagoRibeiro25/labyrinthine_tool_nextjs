"use client";

interface PaginationFooterProps {
	currentPage: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
	loading: boolean;
	onPageChange: (page: number) => void;
}

export default function PaginationFooter({
	currentPage,
	totalPages,
	hasPreviousPage,
	hasNextPage,
	loading,
	onPageChange,
}: PaginationFooterProps) {
	return (
		<div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
			<button
				type="button"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={loading || !hasPreviousPage}
				className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Previous
			</button>

			<div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
				Page {currentPage} of {totalPages}
			</div>

			<button
				type="button"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={loading || !hasNextPage}
				className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Next
			</button>
		</div>
	);
}
