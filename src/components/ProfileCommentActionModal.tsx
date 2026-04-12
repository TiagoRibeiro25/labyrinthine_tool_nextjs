"use client";

import { createPortal } from "react-dom";
import { useRef } from "react";
import { FaXmark } from "react-icons/fa6";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

export type ProfileCommentActionModalState =
	| {
			type: "edit";
			commentId: string;
			originalContent: string;
			input: string;
			error: string;
			submitting: boolean;
	  }
	| {
			type: "delete";
			commentId: string;
			error: string;
			submitting: boolean;
	  }
	| {
			type: "report";
			commentId: string;
			input: string;
			error: string;
			submitting: boolean;
	  };

interface ProfileCommentActionModalProps {
	state: ProfileCommentActionModalState | null;
	onClose: () => void;
	onConfirm: () => void;
	onInputChange: (value: string) => void;
	commentMaxLength: number;
	reportReasonMaxLength: number;
}

export default function ProfileCommentActionModal({
	state,
	onClose,
	onConfirm,
	onInputChange,
	commentMaxLength,
	reportReasonMaxLength,
}: ProfileCommentActionModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(modalRef, () => {
		if (!state || state.submitting) {
			return;
		}

		onClose();
	});

	if (!state || typeof document === "undefined") {
		return null;
	}

	const title =
		state.type === "edit"
			? "Edit Comment"
			: state.type === "delete"
				? "Delete Comment"
				: "Report Comment";

	const description =
		state.type === "edit"
			? "Update your wall message below."
			: state.type === "delete"
				? "This will permanently remove the comment from the wall."
				: "Tell us why this comment should be reviewed.";

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
			<div
				ref={modalRef}
				className="w-full max-w-md bg-neutral-950 border border-neutral-800 border-t-4 border-t-neutral-600 p-6 shadow-2xl relative"
			>
				<button
					onClick={onClose}
					disabled={state.submitting}
					className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer disabled:opacity-40"
				>
					<FaXmark className="w-6 h-6" />
				</button>

				<h2 className="text-lg font-black tracking-widest text-neutral-200 uppercase mb-3 mt-1">
					{title}
				</h2>

				<p className="text-sm text-neutral-400 mb-4">{description}</p>

				{(state.type === "edit" || state.type === "report") && (
					<div className="space-y-2 mb-4">
						<textarea
							value={state.input}
							onChange={(event) => onInputChange(event.target.value)}
							disabled={state.submitting}
							rows={state.type === "edit" ? 4 : 3}
							maxLength={state.type === "edit" ? commentMaxLength : reportReasonMaxLength}
							className="w-full resize-none bg-neutral-900/60 border border-neutral-800 text-neutral-100 px-3 py-2 rounded-sm focus:outline-none focus:border-neutral-500"
						/>
						<p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest text-right">
							{state.input.length}/
							{state.type === "edit" ? commentMaxLength : reportReasonMaxLength}
						</p>
					</div>
				)}

				{state.error && (
					<div className="mb-4 p-2 border border-red-900 bg-red-950/40 text-red-200 text-xs">
						{state.error}
					</div>
				)}

				<div className="flex gap-3">
					<button
						onClick={onClose}
						disabled={state.submitting}
						className="flex-1 px-4 py-2 rounded-sm bg-neutral-900/60 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={state.submitting}
						className={`flex-1 px-4 py-2 rounded-sm font-bold text-xs uppercase tracking-widest border disabled:opacity-50 ${
							state.type === "delete"
								? "bg-red-950 text-red-200 border-red-900 hover:bg-red-900 hover:border-red-500"
								: "bg-neutral-800 text-neutral-100 border-neutral-600 hover:bg-neutral-700 hover:border-neutral-400"
						}`}
					>
						{state.submitting
							? "Working..."
							: state.type === "edit"
								? "Save"
								: state.type === "delete"
									? "Delete"
									: "Submit Report"}
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
}
