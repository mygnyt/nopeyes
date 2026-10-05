import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Share2, Users, Clock, Flame, Zap } from 'lucide-react';
import { Question, VoteStats } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface ResultSectionProps {
  question: Question;
  userChoice: 'A' | 'B';
  stats: VoteStats;
  streak: number;
  onOpenShareModal: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  question,
  userChoice,
  stats,
  streak,
  onOpenShareModal,
}) => {
  const [animatedPercentA, setAnimatedPercentA] = useState(0);
  const [animatedPercentB, setAnimatedPercentB] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  // Animate percentage numbers
  useEffect(() => {
    let frame = 0;
    const totalFrames = 35;
    const interval = setInterval(() => {
      frame++;
      const progress = Math.min(frame / totalFrames, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentA(Math.round(stats.percentA * eased));
      setAnimatedPercentB(Math.round(stats.percentB * eased));

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [stats.percentA, stats.percentB]);

  // Midnight countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diffMs = tomorrow.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const myPercent = userChoice === 'A' ? stats.percentA : stats.percentB;
  const isMajority = myPercent > 50;
  const isSplit = myPercent === 50;

  return (
    <div className="w-full flex flex-col items-center justify-between flex-1 py-3 px-4 max-w-md mx-auto">
      {/* Top Dilemma preview */}
      <div className="w-full text-center mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Результат дня
        </p>
        <p className="text-sm font-medium text-slate-300 line-clamp-2 px-2">
          «{question.text}»
        </p>
      </div>

      {/* Main conclusion banner */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-full my-auto py-2"
      >
        <div className={`p-5 rounded-3xl border shadow-xl text-center relative overflow-hidden ${
          isSplit
            ? 'bg-slate-900/80 border-slate-700/50'
            : isMajority
            ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/90 border-cyan-500/30 shadow-cyan-950/30'
            : 'bg-gradient-to-b from-rose-950/40 to-slate-900/90 border-rose-500/30 shadow-rose-950/30'
        }`}>
          <div className="flex items-center justify-center space-x-2 mb-1.5">
            {isSplit ? (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Раскол 50/50
              </span>
            ) : isMajority ? (
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> В большинстве
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> В меньшинстве
              </span>
            )}
          </div>

          <div className="my-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
              {myPercent}%
            </span>
            <p className="text-xs text-slate-400 mt-1">
              людей сделали такой же выбор, как и ты
            </p>
          </div>
        </div>
      </motion.div>

      {/* Percentage breakdown cards */}
      <div className="w-full space-y-3 my-3">
        {/* Option A breakdown */}
        <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all ${
          userChoice === 'A'
            ? 'border-rose-500/60 bg-rose-950/20 shadow-md shadow-rose-950/40'
            : 'border-white/5 bg-slate-900/40 opacity-70'
        }`}>
          {/* Animated background bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.percentA}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 pr-2">
              <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                userChoice === 'A'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 text-slate-400'
              }`}>
                {userChoice === 'A' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : 'A'}
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                {question.option_a}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-rose-400 shrink-0 ml-2">
              {animatedPercentA}%
            </span>
          </div>
        </div>

        {/* Option B breakdown */}
        <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all ${
          userChoice === 'B'
            ? 'border-cyan-500/60 bg-cyan-950/20 shadow-md shadow-cyan-950/40'
            : 'border-white/5 bg-slate-900/40 opacity-70'
        }`}>
          {/* Animated background bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.percentB}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-0 top-0 bottom-0 bg-cyan-500/15 pointer-events-none"
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 pr-2">
              <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                userChoice === 'B'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-slate-400'
              }`}>
                {userChoice === 'B' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : 'B'}
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                {question.option_b}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-cyan-400 shrink-0 ml-2">
              {animatedPercentB}%
            </span>
          </div>
        </div>
      </div>

      {/* Community votes & Countdown */}
      <div className="w-full flex items-center justify-between px-2 py-2 text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-400" />
          {stats.total} голосов
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" />
          Следующий: {timeLeft}
        </span>
      </div>

      {/* Share Button */}
      <div className="w-full pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('medium');
            onOpenShareModal();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-pink-500/25 active:opacity-90 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Поделиться результатом</span>
        </motion.button>
      </div>
    </div>
  );
};
