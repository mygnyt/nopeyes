import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { ResultSection } from './components/ResultSection';
import { ShareCardModal } from './components/ShareCardModal';
import { StreakModal } from './components/StreakModal';
import { Question, VoteStats, TodayResponse, VoteResponse } from './types';
import {
  initTelegram,
  getTelegramInitData,
  triggerHaptic,
} from './utils/telegram';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState<Question | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [userChoice, setUserChoice] = useState<'A' | 'B' | null>(null);
  const [stats, setStats] = useState<VoteStats | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    initTelegram();
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    setLoading(true);
    setError(null);

    try {
      const initData = getTelegramInitData();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
      }

      const res = await fetch(`/api/today${!initData ? '?demo=true' : ''}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data: TodayResponse = await res.json();
      setQuestion(data.question);
      setStreak(data.user.streak || 0);
      setHasVoted(data.hasVoted);
      setUserChoice(data.userChoice);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Fetch today error:', err);
      setError(err?.message || 'Не удалось загрузить вопрос дня');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (choice: 'A' | 'B') => {
    if (!question || submittingVote || hasVoted) return;

    setSubmittingVote(true);
    try {
      const initData = getTelegramInitData();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
      }

      const res = await fetch('/api/vote', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionId: question.id,
          choice,
          initData,
          demo: !initData,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка при отправке голоса');
      }

      const data: VoteResponse = await res.json();

      if (data.success || data.alreadyVoted) {
        setUserChoice(choice);
        setHasVoted(true);
        setStreak(data.newStreak);
        setStats(data.stats);

        // Haptic & Confetti celebration
        triggerHaptic('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.75 },
          colors: choice === 'A' ? ['#f43f5e', '#fb7185', '#fda4af'] : ['#06b6d4', '#22d3ee', '#67e8f9'],
        });
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      triggerHaptic('warning');
      alert(err.message || 'Ошибка соединения с сервером');
    } finally {
      setSubmittingVote(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-between selection:bg-rose-500/30 selection:text-white">
      {/* Top Navbar */}
      <Header
        streak={streak}
        onStreakClick={() => setIsStreakModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Загрузка дилеммы дня...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Что-то пошло не так
            </p>
            <p className="text-xs text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchTodayData}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-slate-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Попробовать снова</span>
            </button>
          </div>
        ) : question ? (
          hasVoted && userChoice && stats ? (
            <ResultSection
              question={question}
              userChoice={userChoice}
              stats={stats}
              streak={streak}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          ) : (
            <QuestionCard
              question={question}
              onVote={handleVote}
              isLoading={submittingVote}
            />
          )
        ) : null}
      </main>

      {/* Share Result Modal */}
      {question && userChoice && stats && (
        <ShareCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          question={question}
          userChoice={userChoice}
          stats={stats}
          streak={streak}
        />
      )}

      {/* Streak Details Modal */}
      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={streak}
      />
    </div>
  );
};

export default App;
