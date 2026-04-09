export const sliderPuzzleAnimationStyles = `
	@keyframes slideIn {
		from {
			opacity: 0.8;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	@keyframes solveFlash {
		0%, 100% {
			box-shadow: 0 0 20px rgba(74, 222, 128, 0);
		}
		50% {
			box-shadow: 0 0 30px rgba(74, 222, 128, 0.5);
		}
	}
	
	@keyframes titleGlow {
		0%, 100% {
			text-shadow: 0 0 20px rgba(255, 255, 255, 0);
		}
		50% {
			text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
		}
	}
	
	.tile-animated {
		animation: slideIn 0.3s ease-out;
	}
	
	.puzzle-solved {
		animation: solveFlash 1s ease-in-out;
	}
	
	.puzzle-title-glow {
		animation: titleGlow 2s ease-in-out infinite;
	}
`;
