"use client";

import {
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
} from "react";

type Easing = "ease-in" | "ease-out" | "ease-in-out" | "linear";

type Spark = {
	x: number;
	y: number;
	angle: number;
	startTime: number;
};

type ClickSparkProps = {
	sparkColor?: string;
	sparkSize?: number;
	sparkRadius?: number;
	sparkCount?: number;
	duration?: number;
	easing?: Easing;
	extraScale?: number;
	children: ReactNode;
};

const ClickSpark = ({
	sparkColor = "#f00",
	sparkSize = 30,
	sparkRadius = 30,
	sparkCount = 8,
	duration = 660,
	easing = "ease-out",
	extraScale = 1,
	children,
}: ClickSparkProps) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sparksRef = useRef<Spark[]>([]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

		// Size to the viewport only. Observing the page wrapper on tall routes (e.g. wardrobe)
		// previously created enormous canvases and could crash the tab while resizing.
		const resizeCanvas = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const pixelWidth = Math.floor(width * dpr);
			const pixelHeight = Math.floor(height * dpr);

			if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
				canvas.width = pixelWidth;
				canvas.height = pixelHeight;
			}

			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
		};

		const handleResize = () => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			resizeTimeout = setTimeout(resizeCanvas, 100);
		};

		window.addEventListener("resize", handleResize);
		resizeCanvas();

		return () => {
			window.removeEventListener("resize", handleResize);
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
		};
	}, []);

	const easeFunc = useCallback(
		(t: number) => {
			switch (easing) {
				case "linear":
					return t;
				case "ease-in":
					return t * t;
				case "ease-in-out":
					return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
				default:
					return t * (2 - t);
			}
		},
		[easing]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		let animationId = 0;

		const draw = (timestamp: number) => {
			const cssWidth = canvas.clientWidth || window.innerWidth;
			const dpr = cssWidth > 0 ? canvas.width / cssWidth : 1;

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			sparksRef.current = sparksRef.current.filter((spark) => {
				const elapsed = timestamp - spark.startTime;
				if (elapsed >= duration) {
					return false;
				}

				const progress = elapsed / duration;
				const eased = easeFunc(progress);

				const distance = eased * sparkRadius * extraScale;
				const lineLength = sparkSize * (1 - eased);

				const x1 = spark.x + distance * Math.cos(spark.angle);
				const y1 = spark.y + distance * Math.sin(spark.angle);
				const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
				const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

				ctx.strokeStyle = sparkColor;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();

				return true;
			});

			animationId = requestAnimationFrame(draw);
		};

		animationId = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(animationId);
		};
	}, [duration, easeFunc, extraScale, sparkColor, sparkRadius, sparkSize]);

	const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const now = performance.now();

		const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, index) => ({
			x,
			y,
			angle: (2 * Math.PI * index) / sparkCount,
			startTime: now,
		}));

		sparksRef.current.push(...newSparks);
	};

	return (
		<div className="relative h-full w-full" onPointerDown={handlePointerDown}>
			<canvas
				ref={canvasRef}
				className="pointer-events-none fixed inset-0 block h-full w-full select-none"
				style={{ zIndex: 99 }}
			/>
			{children}
		</div>
	);
};

export default ClickSpark;
