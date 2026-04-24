export const PROFILE_COMMENT_MAX_LENGTH = 300;
export const PROFILE_COMMENT_REPORT_REASON_MIN_LENGTH = 5;
export const PROFILE_COMMENT_REPORT_REASON_MAX_LENGTH = 240;

export const PROFILE_COMMENT_MIN_ACCOUNT_AGE_MS = 15 * 60 * 1000;
export const PROFILE_COMMENT_COOLDOWN_MS = 60 * 1000;
export const PROFILE_COMMENT_DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

export const PROFILE_COMMENT_BANNED_PHRASES = [
	"nazi",
	"hitler",
	"kys",
	"kill yourself",
	"faggot",
	"nigger",
	"retard",
	"rape",
] as const;