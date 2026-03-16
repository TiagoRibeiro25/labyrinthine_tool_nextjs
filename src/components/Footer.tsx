import type { FC } from "react";

const Footer: FC = () => {
    return (
        <footer className="w-full max-w-5xl mx-auto px-6 pt-8 border-t border-neutral-900/80 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left mb-8">
            <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">
                    100% Free to Use
                </span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
                <a
                    href="https://tiagodsribeiro.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-400 font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 animate-bounce"
                >
                    Built by GOLD
                </a>
                <p className="text-xs text-neutral-500 max-w-md text-center md:text-right">
                    * This tool is not affiliated with or endorsed by the game
                    developers. All game assets and lore belong to Valko Game
                    Studios.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
