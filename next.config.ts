import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.discordapp.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "media.discordapp.net",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "avatars.steamstatic.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "avatars.akamai.steamstatic.com",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
