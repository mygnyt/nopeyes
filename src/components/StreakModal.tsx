import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Award, Calendar, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose, streak }) => {
  if (!isOpen) return null;

  const milestones = [
    { days: 3, label: '3 дня', icon: Zap, unlocked: streak >= 3 },
    { days: 7, label: 'Неделя', icon: Flame, unlocked: streak >= 7 },
    { days: 14, label: '2 недели', icon: Award, unlocked: streak >= 14 },
    { days: 30, label: 'Месяц', icon: Award, unlocked: streak >= 30 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-sm rounded-3xl bg-[#11131c] border border-white/10 p-5 shadow-2xl relative flex flex-col"
        >
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center pt-2 pb-4">
            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Flame className="w-8 h-8 fill-amber-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {streak} {getStreakWord(streak)} подряд!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Голосуй каждый день, чтобы не прервать огонь стрика.
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {milestones.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    m.unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </div>
                  <span className="text-[11px] font-mono">
                    {m.unlocked ? 'Достигнуто ✓' : `${m.days} дн.`}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/15 transition-all"
          >
            Понятно
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
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
