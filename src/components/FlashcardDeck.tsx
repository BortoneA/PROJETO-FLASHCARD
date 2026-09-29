"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import {
  CheckCircle2, Flame, ArrowLeft, Layers,
  Trophy, Star, RotateCcw
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  { rating: 1 as const, label: "Errei", time: "10 min", color: "rose", key: "1" },
  { rating: 2 as const, label: "Dif\u00edcil", time: "1 dia", color: "amber", key: "2" },
  { rating: 3 as const, label: "Bom", time: "3 dias", color: "emerald", key: "3" },
  { rating: 4 as const, label: "F\u00e1cil", time: "4 dias", color: "blue", key: "4" },
] as const;

const colorMap: Record<string, { bg: string; hover: string; text: string; border: string; subtext: string }> = {
  rose: {
    bg: "bg-rose-50/90 dark:bg-rose-950/40",
    hover: "hover:bg-rose-100 dark:hover:bg-rose-900/50",
    text: "text-rose-800 dark:text-rose-200",
    border: "border-rose-200 dark:border-rose-800/60",
    subtext: "text-rose-700 dark:text-rose-300 font-semibold",
  },
  amber: {
    bg: "bg-amber-50/90 dark:bg-amber-950/40",
    hover: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-800/60",
    subtext: "text-amber-700 dark:text-amber-300 font-semibold",
  },
  emerald: {
    bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-800/60",
    subtext: "text-emerald-700 dark:text-emerald-300 font-semibold",
  },
  blue: {
    bg: "bg-blue-50/90 dark:bg-blue-950/40",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
    text: "text-blue-800 dark:text-blue-200",
    border: "border-blue-200 dark:border-blue-800/60",
    subtext: "text-blue-700 dark:text-blue-300 font-semibold",
  },
};

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

    if (rating === 4) {
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
        setTimeout(() => setFloatingXp(null), 1300);
      }

      if (res?.didLevelUp) {
        confetti({
          particleCount: 90,
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

  // ═══════════ COMPLETION SCREEN ═══════════
  if (!currentCard || cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-8 sm:p-10 rounded-3xl shadow-sm max-w-sm w-full transition-colors">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 size={32} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            {cards.length === 0 ? "Tudo em dia!" : "Sess\u00e3o conclu\u00edda!"}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {cards.length === 0 ? (
              <span>{"Nenhum card pendente de revis\u00e3o neste baralho por enquanto."}</span>
            ) : (
              <span>
                {"Voc\u00ea revisou "}
                <strong className="text-zinc-900 dark:text-zinc-100">{completedCount} cards</strong>
                {" e refor\u00e7ou sua mem\u00f3ria de longo prazo."}
              </span>
            )}
          </p>

          {completedCount > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-500 font-semibold block">Revisados</span>
                <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{completedCount}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="text-[10px] text-zinc-500 font-semibold block">{"Sequ\u00eancia"}</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Flame size={15} /> {streak}
                </span>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold rounded-xl transition text-center shadow-sm block text-sm min-h-[44px] flex items-center justify-center gap-2"
          >
            <ArrowLeft size={15} />
            <span>{"Voltar \u00e0 Central"}</span>
          </Link>
        </div>
      </div>
    );
  }

  // ═══════════ STUDY VIEW ═══════════
  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center relative min-h-screen">
      {/* Floating XP Badge */}
      <AnimatePresence>
        {floatingXp !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="absolute top-16 z-40 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md flex items-center gap-1.5 border border-zinc-700 dark:border-zinc-300"
          >
            <Star size={13} className="fill-current text-amber-400" />
            <span>+{floatingXp} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {levelUpModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 rounded-2xl shadow-xl max-w-xs w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/20">
                <Trophy size={32} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                {"Novo N\u00edvel Alcan\u00e7ado"}
              </span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 mb-1">
                {"N\u00edvel"} {levelUpModal.level}
              </h2>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-5">
                {levelUpModal.title}
              </p>
              <button
                onClick={() => setLevelUpModal(null)}
                className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold rounded-xl text-xs transition"
              >
                Continuar Estudando
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ HEADER ═══════════ */}
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm"
        >
          <ArrowLeft size={14} />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">{deckTitle}</span>
        </Link>

        <div className="flex items-center gap-2">
          {currentCard.deck && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-[11px] font-medium border border-zinc-200/80 dark:border-zinc-700/80 truncate max-w-[120px]">
              <Layers size={11} /> {currentCard.deck.title}
            </span>
          )}
          {streak > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-[11px] font-bold border border-amber-200/80 dark:border-amber-500/20">
              <Flame size={12} /> {streak}
            </span>
          )}
          <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold border border-zinc-200/80 dark:border-zinc-700/80 tabular-nums">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>
      </div>

      {/* ═══════════ PROGRESS BAR ═══════════ */}
      <div className="w-full mb-5">
        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ═══════════ FLASHCARD ═══════════ */}
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full min-h-[300px] sm:min-h-[360px] rounded-2xl sm:rounded-3xl p-6 sm:p-10 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-center transition-colors"
          >
            {/* Card Image */}
            {currentCard.imageUrl && (
              <div className="mb-4 max-h-36 sm:max-h-44 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <img
                  src={currentCard.imageUrl}
                  alt="Anexo"
                  className="h-full w-auto object-cover max-h-36 sm:max-h-44"
                />
              </div>
            )}

            {!isFlipped ? (
              /* ─── FRONT ─── */
              <div className="flex flex-col items-center justify-center w-full py-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full mb-5 border border-blue-200/80 dark:border-blue-500/20">
                  Pergunta
                </span>
                <div className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed break-words max-w-full prose-card">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.front}</ReactMarkdown>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-8 flex items-center gap-1.5 font-semibold">
                  <RotateCcw size={12} />
                  <span>Toque para virar o card</span>
                </p>
              </div>
            ) : (
              /* ─── BACK ─── */
              <div className="flex flex-col items-center justify-center w-full py-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full mb-4 border border-emerald-200/80 dark:border-emerald-500/20">
                  Resposta
                </span>
                <div className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed mb-4 break-words max-w-full prose-card">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.back}</ReactMarkdown>
                </div>
                {currentCard.extra && (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 max-w-sm w-full prose-card text-left mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.extra}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════════ ANSWER BUTTONS ═══════════ */}
      <div className="w-full">
        {isFlipped ? (
          <div className="w-full grid grid-cols-4 gap-2">
            {ANSWER_BUTTONS.map((btn) => {
              const c = colorMap[btn.color];
              return (
                <button
                  key={btn.rating}
                  onClick={() => handleAnswer(btn.rating)}
                  disabled={isSyncing}
                  className={`group flex flex-col items-center py-2.5 px-2 rounded-xl sm:rounded-2xl border ${c.bg} ${c.hover} ${c.text} ${c.border} transition-all duration-150 active:scale-95 touch-manipulation min-h-[58px] justify-center disabled:opacity-50`}
                >
                  <span className={`text-[10px] ${c.subtext} font-medium`}>{btn.time}</span>
                  <span className="font-bold text-xs sm:text-sm">{btn.label}</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono rounded bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 mt-0.5">
                    {btn.key}
                  </kbd>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm shadow-sm transition active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2 min-h-[50px]"
          >
            <span>Mostrar Resposta</span>
            <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 dark:bg-black/10 hidden sm:inline">
              Espa\u00e7o
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
}
