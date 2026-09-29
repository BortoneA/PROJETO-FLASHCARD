"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import {
  X, Flame, Gem, Star, Trophy, RotateCcw,
  Sparkles, CheckCircle2, ChevronRight
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Mascot from "./Mascot";

interface Card {
  id: string;
  front: string;
  back: string;
  extra?: string | null;
  imageUrl?: string | null;
  easeFactor: number;
  interval: number;
  deck?: {
    title: string;
    icon: string;
  };
}

const ANSWER_BUTTONS = [
  { rating: 1 as const, label: "Errei", time: "10 min", btnClass: "btn-duo-red", key: "1" },
  { rating: 2 as const, label: "Dif\u00edcil", time: "1 dia", btnClass: "btn-duo-orange", key: "2" },
  { rating: 3 as const, label: "Bom", time: "3 dias", btnClass: "btn-duo-green", key: "3" },
  { rating: 4 as const, label: "F\u00e1cil", time: "4 dias", btnClass: "btn-duo-blue", key: "4" },
] as const;

export default function FlashcardDeck({
  deckId,
  deckTitle,
  initialCards,
}: {
  deckId: string;
  deckTitle: string;
  initialCards: Card[];
}) {
  const [cards] = useState<Card[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [floatingXp, setFloatingXp] = useState<number | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{ level: number; title: string } | null>(null);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const progress = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;

  const handleAnswer = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard || isSyncing) return;

    setIsSyncing(true);

    if (rating === 4 || rating === 3) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
      });
    }

    try {
      const res = await submitCardReview(currentCard.id, rating);

      if (res?.xpEarned) {
        setFloatingXp(res.xpEarned);
        setTimeout(() => setFloatingXp(null), 1400);
      }

      if (res?.didLevelUp) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
        setLevelUpModal({ level: res.newLevel, title: res.newTitle });
      }
    } catch (err) {
      console.error("Erro na sincroniza\u00e7\u00e3o:", err);
    } finally {
      setIsSyncing(false);
    }

    setCompletedCount((prev) => prev + 1);
    if (rating >= 3) setStreak((prev) => prev + 1);
    else setStreak(0);

    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(cards.length);
    }
  }, [currentCard, isSyncing, currentIndex, cards.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
        const ratingMap: Record<string, 1 | 2 | 3 | 4> = {
          Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4,
        };
        handleAnswer(ratingMap[e.code]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleAnswer]);

  // ═══════════ COMPLETION SCREEN (DUOLINGO LESSON COMPLETE) ═══════════
  if (!currentCard || cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="card-duo bg-white dark:bg-[#18191c] p-8 sm:p-10 max-w-md w-full shadow-xl transition-colors"
        >
          {/* Cheering Mascot */}
          <div className="mb-5 flex justify-center">
            <Mascot size={130} mood="cheering" className="animate-bounce" />
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-[#58cc02]">
            {"Li\u00e7\u00e3o Conclu\u00edda!"}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 mb-2">
            {cards.length === 0 ? "Tudo Zerado!" : "Mandou muito bem!"}
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            {cards.length === 0 ? (
              <span>{"Nenhum card precisando de revis\u00e3o no momento."}</span>
            ) : (
              <span>
                {"Voc\u00ea praticou "}
                <strong className="text-[#58cc02]">{completedCount} cards</strong>
                {" com maestria!"}
              </span>
            )}
          </p>

          {completedCount > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card-duo bg-zinc-50 dark:bg-zinc-800/60 p-3.5">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">
                  Cards Revisados
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white">{completedCount}</span>
              </div>
              <div className="card-duo bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 p-3.5">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider block">
                  {"Sequ\u00eancia"}
                </span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Flame size={18} className="fill-amber-500" /> {streak}
                </span>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="w-full btn-duo-green py-4 rounded-2xl font-black text-sm uppercase tracking-wider block shadow-md text-center"
          >
            Continuar
          </Link>
        </motion.div>
      </div>
    );
  }

  // ═══════════ DUOLINGO STUDY VIEW ═══════════
  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center relative min-h-screen">
      {/* Floating XP Badge */}
      <AnimatePresence>
        {floatingXp !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1.1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="absolute top-16 z-40 bg-[#ffc800] text-zinc-950 px-4 py-2 rounded-2xl font-black text-sm shadow-xl flex items-center gap-1.5 border-2 border-yellow-300"
          >
            <Star size={16} className="fill-current text-zinc-950" />
            <span>+{floatingXp} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {levelUpModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-duo bg-white dark:bg-[#18191c] p-7 rounded-3xl shadow-2xl max-w-xs w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-amber-300">
                <Trophy size={36} />
              </div>
              <span className="text-[11px] uppercase font-black tracking-wider text-amber-500">
                {"Novo N\u00edvel!"}
              </span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 mb-1">
                {"N\u00edvel"} {levelUpModal.level}
              </h2>
              <p className="text-sm font-bold text-[#58cc02] mb-5">
                {levelUpModal.title}
              </p>
              <button
                onClick={() => setLevelUpModal(null)}
                className="w-full btn-duo-green py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
              >
                Continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ TOP LESSON BAR (DUOLINGO STYLE) ═══════════ */}
      <div className="w-full flex items-center gap-3 sm:gap-4 mb-5">
        {/* Close Button ✕ */}
        <Link
          href="/"
          className="w-10 h-10 rounded-2xl btn-duo-white flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0"
          title="Sair da li\u00e7\u00e3o"
        >
          <X size={20} strokeWidth={3} />
        </Link>

        {/* Duolingo Chunky Progress Bar */}
        <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full border-2 border-zinc-300 dark:border-zinc-700 p-0.5 overflow-hidden">
          <div
            className="h-full bg-[#58cc02] rounded-full transition-all duration-300 relative overflow-hidden shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"
            style={{ width: `${progress}%` }}
          >
            {/* Glossy highlight stripe */}
            <div className="absolute inset-x-0 top-0 h-[40%] bg-white/30 rounded-full" />
          </div>
        </div>

        {/* Quick Streak Badge */}
        {streak > 0 && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 font-black text-xs shrink-0">
            <Flame size={14} className="fill-amber-500" />
            <span>{streak}</span>
          </div>
        )}
      </div>

      {/* ═══════════ FLASHCARD EXERCISE TILE ═══════════ */}
      <div
        className="w-full cursor-pointer select-none mb-6 touch-manipulation perspective-1000"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard.id}-${isFlipped ? "back" : "front"}`}
            initial={{ rotateY: isFlipped ? -45 : 45, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 45 : -45, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card-duo w-full min-h-[320px] sm:min-h-[380px] p-6 sm:p-8 bg-white dark:bg-[#18191c] flex flex-col items-center justify-center text-center shadow-md transition-colors"
          >
            {/* Card Image */}
            {currentCard.imageUrl && (
              <div className="mb-4 max-h-36 sm:max-h-44 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
                <img
                  src={currentCard.imageUrl}
                  alt="Anexo"
                  className="h-full w-auto object-cover max-h-36 sm:max-h-44"
                />
              </div>
            )}

            {!isFlipped ? (
              /* ─── FRONT (QUESTION) ─── */
              <div className="flex flex-col items-center justify-center w-full py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mascot size={32} mood="happy" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#1cb0f6] bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    Pergunta
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-relaxed break-words max-w-full prose-card">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.front}</ReactMarkdown>
                </div>

                <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 mt-8 flex items-center gap-1.5 uppercase tracking-wider">
                  <RotateCcw size={13} strokeWidth={2.5} />
                  <span>Toque para ver a resposta</span>
                </p>
              </div>
            ) : (
              /* ─── BACK (ANSWER) ─── */
              <div className="flex flex-col items-center justify-center w-full py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mascot size={32} mood="cheering" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#58cc02] bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                    Resposta
                  </span>
                </div>

                <div className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-relaxed mb-4 break-words max-w-full prose-card">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.back}</ReactMarkdown>
                </div>

                {currentCard.extra && (
                  <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 max-w-sm w-full prose-card text-left mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.extra}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════════ 3D DUOLINGO GRADING BUTTONS ═══════════ */}
      <div className="w-full">
        {isFlipped ? (
          <div className="w-full grid grid-cols-4 gap-2 sm:gap-3">
            {ANSWER_BUTTONS.map((btn) => (
              <button
                key={btn.rating}
                onClick={() => handleAnswer(btn.rating)}
                disabled={isSyncing}
                className={`${btn.btnClass} flex flex-col items-center py-3 px-2 rounded-2xl active:scale-95 shadow-sm touch-manipulation min-h-[64px] justify-center disabled:opacity-50`}
              >
                <span className="text-[10px] font-bold opacity-90">{btn.time}</span>
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider">{btn.label}</span>
                <span className="text-[9px] font-mono opacity-80 hidden sm:inline">[{btn.key}]</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full btn-duo-green py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
          >
            <span>Mostrar Resposta</span>
            <kbd className="text-xs bg-black/20 text-white px-2 py-0.5 rounded-lg hidden sm:inline">
              Espa\u00e7o
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
}
