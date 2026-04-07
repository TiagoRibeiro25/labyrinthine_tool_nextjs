export default async function PlayerCount() {
	try {
		const res = await fetch(
			"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=1302240",
			{ next: { revalidate: 60 } }
		);
		if (!res.ok) return null;
		const data = await res.json();
		const count = data.response?.player_count;
		if (count === undefined) return null;

		return (
			<div className="mt-8 flex flex-col items-center justify-center space-y-1">
				<span className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-br from-neutral-100 to-neutral-500">
					{count.toLocaleString()}
				</span>
				<span className="text-xs text-neutral-500 font-semibold uppercase tracking-widest">
					Players Online Now
				</span>
			</div>
		);
	} catch {
		return null;
	}
}
