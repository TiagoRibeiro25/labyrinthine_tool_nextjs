export const lightsOutAnimationStyles = `
	@keyframes cellToggle {
		0% {
			transform: scale(1);
			box-shadow: 0 0 0 rgba(252, 211, 77, 0);
		}
		50% {
			transform: scale(1.1);
			box-shadow: 0 0 20px rgba(252, 211, 77, 0.8);
		}
		100% {
			transform: scale(1);
			box-shadow: 0 0 15px rgba(252, 211, 77, 0.6);
		}
	}
	
	@keyframes lightUp {
		from {
			opacity: 0.5;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	@keyframes lightDown {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0.6;
			transform: scale(0.95);
		}
	}
	
	@keyframes winCelebration {
		0%, 100% {
			transform: scale(1);
			box-shadow: 0 0 0 rgba(34, 197, 94, 0);
		}
		25% {
			transform: scale(1.05);
		}
		50% {
			box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
			transform: scale(1.08);
		}
		75% {
			transform: scale(1.05);
		}
	}
	
	@keyframes boardSuccess {
		0%, 100% {
			border-color: rgba(34, 197, 94, 0);
		}
		50% {
			border-color: rgba(34, 197, 94, 0.8);
		}
	}
	
	.cell-toggled {
		animation: cellToggle 0.4s ease-out;
	}
	
	.cell-lit {
		animation: lightUp 0.3s ease-out;
	}
	
	.cell-dark {
		animation: lightDown 0.3s ease-out;
	}
	
	.board-won {
		animation: boardSuccess 0.8s ease-in-out;
	}
	
	.win-message {
		animation: winCelebration 0.6s ease-in-out;
	}
`;
