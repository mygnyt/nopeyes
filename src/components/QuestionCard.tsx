import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Question } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface QuestionCardProps {
  question: Question;
  onVote: (choice: 'A' | 'B') => void;
  isLoading: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onVote,
  isLoading,
}) => {
  const handleSelect = (choice: 'A' | 'B') => {
    if (isLoading) return;
    triggerHaptic('medium');
    onVote(choice);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between flex-1 py-4 px-4 max-w-md mx-auto">
      {/* Category / Badge */}
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          Моральная дилемма #{question.id}
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          1 ответ в день
        </span>
      </div>

      {/* Dilemma Question Main Text */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full my-auto py-6"
      >
        <div className="relative p-6 rounded-3xl glass-card border border-white/10 shadow-2xl overflow-hidden">
          {/* Subtle gradient background glow */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <p className="text-xl sm:text-2xl font-bold leading-snug text-slate-100 text-center relative z-10 tracking-tight">
            «{question.text}»
          </p>
        </div>
      </motion.div>

      {/* Choice Buttons */}
      <div className="w-full space-y-3.5 mt-auto mb-2">
        {/* Option A */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
          onClick={() => handleSelect('A')}
          className="w-full relative group overflow-hidden rounded-2xl p-4 text-left border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-dark-800 to-dark-800 hover:border-rose-500/60 active:border-rose-400 transition-all shadow-lg shadow-rose-950/20"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3 pr-2">
              <span className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                A
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-white transition-colors">
                {question.option_a}
              </span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>

        {/* Option B */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
          onClick={() => handleSelect('B')}
          className="w-full relative group overflow-hidden rounded-2xl p-4 text-left border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-dark-800 to-dark-800 hover:border-cyan-500/60 active:border-cyan-400 transition-all shadow-lg shadow-cyan-950/20"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3 pr-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                B
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-white transition-colors">
                {question.option_b}
              </span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      </div>

      <p className="text-[11px] text-slate-500 text-center tracking-wide">
        Выбор нельзя изменить до завтрашнего дня
      </p>
    </div>
  );
};
