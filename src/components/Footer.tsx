import type { FC } from "react";

const Footer: FC = () => {
    return (
        <footer className="w-full max-w-5xl mx-auto px-6 pt-8 border-t border-neutral-900/80 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left mb-8">
            <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-white font-black tracking-widest uppercase text-sm">
                    Open Source
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-neutral-400 font-medium text-sm uppercase tracking-wider">
                    100% Free to Use
                </span>
            </div>
            <div>
                <p className="text-xs text-neutral-500 max-w-md">
                    * This tool is not affiliated with or endorsed by the game
                    developers. All game assets and lore belong to Valko Game
                    Studios.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
