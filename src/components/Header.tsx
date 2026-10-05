import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface HeaderProps {
  streak: number;
  dateStr?: string;
  onStreakClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ streak, onStreakClick }) => {
  // Format today's date in Russian
  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const handleStreakClick = () => {
    triggerHaptic('light');
    if (onStreakClick) onStreakClick();
  };

  return (
    <header className="w-full flex items-center justify-between py-3 px-4 safe-top select-none">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-rose-500/10">
          <div className="w-full h-full bg-[#090a0f] rounded-[11px] flex items-center justify-center">
            <span className="font-extrabold text-sm tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-cyan-300">
              NY
            </span>
          </div>
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
            NOPEYES
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          </h1>
          <p className="text-[11px] text-slate-400 capitalize">
            {formattedDate} • Выбор дня
          </p>
        </div>
      </div>

      <button
        onClick={handleStreakClick}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 active:scale-95 transition-all text-amber-400"
      >
        <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce" style={{ animationDuration: '2s' }} />
        <span className="text-xs font-bold font-mono tracking-tight">
          {streak} {getStreakWord(streak)}
        </span>
      </button>
    </header>
  );
};

function getStreakWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}
