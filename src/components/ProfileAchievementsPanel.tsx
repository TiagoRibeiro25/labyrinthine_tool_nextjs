import {
	FaLightbulb,
	FaPuzzlePiece,
	FaShirt,
	FaTrophy,
	FaUserGroup,
} from "react-icons/fa6";
import type { AchievementIcon, ProfileAchievement } from "../lib/profile-achievements";

type ProfileAchievementsPanelProps = {
	achievements: ProfileAchievement[];
	unlockedAchievementsCount: number;
	completedCategoryCount: number;
	totalCategoryCount: number;
};

function renderAchievementIcon(icon: AchievementIcon, className: string) {
	switch (icon) {
		case "shirt":
			return <FaShirt className={className} />;
		case "trophy":
			return <FaTrophy className={className} />;
		case "friends":
			return <FaUserGroup className={className} />;
		case "lightbulb":
			return <FaLightbulb className={className} />;
		case "puzzle":
			return <FaPuzzlePiece className={className} />;
		default:
			return <FaShirt className={className} />;
	}
}

export default function ProfileAchievementsPanel({
	achievements,
	unlockedAchievementsCount,
	completedCategoryCount,
	totalCategoryCount,
}: ProfileAchievementsPanelProps) {
	return (
		<div className="mt-4 p-4 bg-neutral-900/30 border border-neutral-800 rounded-sm">
			<div className="flex items-center justify-between gap-3 mb-3">
				<p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
					Achievements
				</p>
				<span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
					{unlockedAchievementsCount}/{achievements.length} Unlocked
				</span>
			</div>
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
				{achievements.map((achievement) => (
					<div
						key={achievement.id}
						className={`p-3 border rounded-sm transition-colors ${
							achievement.unlocked
								? "bg-amber-900/20 border-amber-700/60"
								: "bg-neutral-900/40 border-neutral-800"
						}`}
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2 min-w-0">
								<span className="text-sm shrink-0">
									{renderAchievementIcon(
										achievement.icon,
										achievement.iconClassName
									)}
								</span>
								<p className="text-[11px] font-bold uppercase tracking-widest text-neutral-200 truncate">
									{achievement.title}
								</p>
							</div>
							<span
								className={`text-[10px] font-bold uppercase tracking-widest ${
									achievement.unlocked ? "text-amber-300" : "text-neutral-500"
								}`}
							>
								{achievement.progress}
							</span>
						</div>
						<p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
							{achievement.description}
						</p>
					</div>
				))}
			</div>
			<p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mt-3">
				Completed categories: {completedCategoryCount}/{totalCategoryCount}
			</p>
		</div>
	);
}
