"use client";

import React from "react";
import Snowfall from "react-snowfall";

// This component renders falling snowflakes during December ONLY
const Snowflakes: React.FC = (): React.JSX.Element | null => {
	const now = new Date();
	const isDecember = now.getMonth() === 11; // 0 = Jan, 11 = Dec

	if (!isDecember) {
		return null;
	}

	return (
		<div className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-50">
			<Snowfall />
		</div>
	);
};

export default Snowflakes;
