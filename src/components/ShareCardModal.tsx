import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Copy, Check, Sparkles, Flame } from 'lucide-react';
import { Question, VoteStats } from '../types';
import { shareToTelegram, triggerHaptic } from '../utils/telegram';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  userChoice: 'A' | 'B';
  stats: VoteStats;
  streak: number;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  question,
  userChoice,
  stats,
  streak,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const myPercent = userChoice === 'A' ? stats.percentA : stats.percentB;
  const myChoiceText = userChoice === 'A' ? question.option_a : question.option_b;
  const isMajority = myPercent > 50;

  // Formatted share text for Telegram chats
  const shareText = 
`⚡ NOPEYES — Моральный выбор дня

«${question.text}»

👉 Мой выбор: ${myChoiceText}
📊 Я с ${myPercent}% ${isMajority ? '(в большинстве 🔥)' : '(в меньшинстве ⚡)'}
🔥 Мой стрик: ${streak} дн.

А что выберешь ты? Заходи в @nopeyes_play_bot`;

  const handleShareTelegram = () => {
    triggerHaptic('success');
    shareToTelegram(shareText);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      triggerHaptic('light');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-sm rounded-3xl bg-[#11131c] border border-white/10 p-5 shadow-2xl relative flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-sm font-semibold text-slate-300 mb-3 text-center">
            Карточка для друзей
          </h3>

          {/* Visual Share Card */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-[#151824] to-[#0c0d14] border border-white/15 shadow-2xl relative overflow-hidden mb-4">
            {/* Ambient gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <span className="text-[11px] font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-cyan-400">
                NOPEYES • ДИЛЕММА ДНЯ
              </span>
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 fill-amber-400" /> {streak} дн.
              </span>
            </div>

            {/* Question */}
            <p className="text-sm font-bold text-white leading-relaxed mb-4">
              «{question.text}»
            </p>

            {/* Choice */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 mb-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Мой выбор:
              </div>
              <div className="text-xs font-semibold text-slate-200">
                {myChoiceText}
              </div>
            </div>

            {/* Big Badge: "Я с 12%" */}
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500/20 to-cyan-500/20 border border-white/20">
                <span className="text-base font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-white to-cyan-300">
                  ⚡ Я С {myPercent}%
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>@nopeyes_play_bot</span>
              <span>Telegram Mini App</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleShareTelegram}
              className="w-full py-3 px-4 rounded-xl bg-[#229ed9] hover:bg-[#2094cc] active:scale-95 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-sky-900/30"
            >
              <Send className="w-4 h-4" />
              <span>Отправить в Telegram</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Текст скопирован!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать текст</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
