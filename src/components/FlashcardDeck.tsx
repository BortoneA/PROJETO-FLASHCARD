"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import {
  Sparkles, CheckCircle2, Flame, Zap, ArrowLeft, Layers,
  Trophy, Star, RotateCcw, ChevronRight
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
  { rating: 1 as const, label: "Again", time: "10 min", color: "rose", key: "1" },
  { rating: 2 as const, label: "Hard", time: "1 dia", color: "amber", key: "2" },
  { rating: 3 as const, label: "Good", time: "3 dias", color: "emerald", key: "3" },
  { rating: 4 as const, label: "Easy", time: "4 dias", color: "blue", key: "4" },
] as const;

const colorMap: Record<string, { bg: string; hover: string; text: string; border: string; subtext: string }> = {
  rose:    { bg: "bg-rose-50 dark:bg-rose-500/12",    hover: "hover:bg-rose-100 dark:hover:bg-rose-500",    text: "text-rose-600 dark:text-rose-400",    border: "border-rose-200 dark:border-rose-500/25",    subtext: "text-rose-500/70 dark:text-rose-300/70" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/12",   hover: "hover:bg-amber-100 dark:hover:bg-amber-500",   text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-500/25",   subtext: "text-amber-500/70 dark:text-amber-300/70" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/12", hover: "hover:bg-emerald-100 dark:hover:bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/25", subtext: "text-emerald-500/70 dark:text-emerald-300/70" },
  blue:    { bg: "bg-blue-50 dark:bg-[#0071e3]/12",   hover: "hover:bg-blue-100 dark:hover:bg-[#0071e3]",   text: "text-[#0071e3]",   border: "border-blue-200 dark:border-[#0071e3]/25",   subtext: "text-blue-500/70 dark:text-blue-300/70" },
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
  const progress = totalCards > 0 ? ((currentIndex) / totalCards) * 100 : 0;

  const handleAnswer = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard || isSyncing) return;

    setIsSyncing(true);

    if (rating === 4) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.75 },
        colors: ["#0071e3", "#34c759", "#af52de", "#ff9500", "#5856d6"],
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
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#0071e3", "#af52de"],
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
      <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white/70 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-10 rounded-3xl shadow-2xl max-w-sm w-full transition-colors"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 border border-emerald-200 dark:border-emerald-500/20 transition-colors"
          >
            <CheckCircle2 size={36} />
          </motion.div>

          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-2 transition-colors">
            {cards.length === 0 ? "Tudo em dia!" : `Sess\u00e3o conclu\u00edda!`}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed transition-colors">
            {cards.length === 0 ? (
              <>{"N\u00e3o h\u00e1 cards para revis\u00e3o agora. Seus estudos foram "}
              <span className="font-bold text-emerald-500 dark:text-emerald-400">assimilados</span>
              {" e reaparecer\u00e3o conforme o cronograma!"}</>
            ) : (
              <>{"Voc\u00ea revisou "}
              <span className="font-bold text-emerald-500 dark:text-emerald-400">{completedCount}</span>
              {" cards e acumulou XP!"}</>
            )}
          </p>

          {completedCount > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="bg-zinc-100 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/40 transition-colors">
                <p className="text-[10px] text-zinc-500 font-semibold">Revisados</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white">{completedCount}</p>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/40 transition-colors">
                <p className="text-[10px] text-zinc-500 font-semibold">{"Sequ\u00eancia"}</p>
                <p className="text-lg font-black text-amber-500 dark:text-amber-400">{streak} {"\uD83D\uDD25"}</p>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="w-full py-3.5 px-4 bg-[#0071e3] hover:bg-[#005bb5] text-white font-extrabold rounded-xl transition-all text-center shadow-lg shadow-[#0071e3]/20 block text-sm min-h-[48px] flex items-center justify-center gap-2 touch-manipulation"
          >
            <ArrowLeft size={16} /> {"Voltar \u00e0 Central"}
          </Link>
        </motion.div>
      </div>
    );
  }

  // ═══════════ STUDY VIEW ═══════════
  return (
    <div className="max-w-lg mx-auto px-4 py-4 sm:py-8 flex flex-col items-center relative min-h-screen">

      {/* Floating XP Badge */}
      <AnimatePresence>
        {floatingXp !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.7 }}
            animate={{ opacity: 1, y: -30, scale: 1.1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute top-20 z-40 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 px-3.5 py-1.5 rounded-full font-black text-sm shadow-xl flex items-center gap-1 border border-amber-300"
          >
            <Star size={14} className="fill-current" /> +{floatingXp} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {levelUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 transition-colors"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white dark:bg-zinc-900 border-2 border-amber-300 dark:border-amber-500/30 p-7 sm:p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center relative overflow-hidden transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 dark:from-amber-500/5 to-transparent pointer-events-none" />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                className="relative z-10 w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-500/20"
              >
                <Trophy size={40} />
              </motion.div>

              <span className="relative z-10 text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-amber-500 dark:text-amber-400">{"Novo n\u00edvel alcan\u00e7ado!"}</span>
              <h2 className="relative z-10 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 mb-1 transition-colors">{"N\u00edvel"} {levelUpModal.level}</h2>
              <p className="relative z-10 text-base sm:text-lg font-bold text-[#0071e3] dark:text-cyan-400 mb-6 transition-colors">{levelUpModal.title}</p>

              <button
                onClick={() => setLevelUpModal(null)}
                className="relative z-10 w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black rounded-xl shadow-lg active:scale-95 transition-all min-h-[48px] touch-manipulation"
              >
                {"Continuar estudando \uD83D\uDD25"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ HEADER ═══════════ */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white/70 dark:bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 min-h-[40px] touch-manipulation"
        >
          <ArrowLeft size={14} />
          <span className="truncate max-w-[100px] sm:max-w-[180px]">{deckTitle}</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {currentCard.deck && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-bold border border-purple-200 dark:border-purple-500/15 truncate max-w-[100px] transition-colors">
              <Layers size={11} /> {currentCard.deck.title}
            </span>
          )}
          {streak > 0 && (
            <span className="flex items-center gap-1 px-2 py-1.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-500/15 transition-colors">
              <Flame size={11} /> {streak}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-700/40 transition-colors">
            {currentIndex + 1}/{totalCards}
          </span>
        </div>
      </div>

      {/* ═══════════ PROGRESS BAR ═══════════ */}
      <div className="w-full mb-5 sm:mb-6">
        <div className="w-full h-1 sm:h-1.5 bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden transition-colors">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#0071e3] via-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ═══════════ FLASHCARD ═══════════ */}
      <div
        className="w-full cursor-pointer select-none mb-5 sm:mb-6 touch-manipulation perspective-1000"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard.id}-${isFlipped ? "back" : "front"}`}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="w-full min-h-[280px] sm:min-h-[340px] rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-colors"
          >
            {/* Card Image */}
            {currentCard.imageUrl && (
              <div className="mb-4 max-h-32 sm:max-h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800/60 transition-colors">
                <img
                  src={currentCard.imageUrl}
                  alt="Anexo"
                  className="h-full w-auto object-cover max-h-32 sm:max-h-40"
                />
              </div>
            )}

            {!isFlipped ? (
              /* ─── FRONT ─── */
              <div className="flex flex-col items-center justify-center w-full py-2">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-extrabold text-[#0071e3] bg-[#0071e3]/8 px-2.5 py-1 rounded-full mb-4 border border-[#0071e3]/15">
                  Pergunta
                </span>
                <div className="text-lg sm:text-2xl font-extrabold text-zinc-900 dark:text-white leading-snug break-words max-w-full prose-card transition-colors">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.front}</ReactMarkdown>
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-6 flex items-center gap-1.5 transition-colors">
                  <RotateCcw size={11} /> Toque para virar
                </p>
              </div>
            ) : (
              /* ─── BACK ─── */
              <div className="flex flex-col items-center justify-center w-full py-2">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-extrabold text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/8 px-2.5 py-1 rounded-full mb-3 border border-emerald-200 dark:border-emerald-500/15 transition-colors">
                  Resposta
                </span>
                <div className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white leading-relaxed mb-3 break-words max-w-full prose-card transition-colors">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.back}</ReactMarkdown>
                </div>
                {currentCard.extra && (
                  <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/30 max-w-sm w-full prose-card transition-colors">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.extra}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════════ ANSWER BUTTONS ═══════════ */}
      <AnimatePresence mode="wait">
        {isFlipped ? (
          <motion.div
            key="answers"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full grid grid-cols-4 gap-1.5 sm:gap-2"
          >
            {ANSWER_BUTTONS.map((btn) => {
              const c = colorMap[btn.color];
              return (
                <button
                  key={btn.rating}
                  onClick={() => handleAnswer(btn.rating)}
                  disabled={isSyncing}
                  className={`group flex flex-col items-center py-2.5 sm:py-3.5 px-1 rounded-xl sm:rounded-2xl ${c.bg} ${c.hover} ${c.text} hover:text-white dark:hover:text-white border ${c.border} transition-all duration-150 active:scale-95 touch-manipulation min-h-[56px] justify-center disabled:opacity-50`}
                >
                  <span className={`text-[9px] sm:text-[10px] ${c.subtext} font-medium`}>{btn.time}</span>
                  <span className="font-black text-[11px] sm:text-sm">{btn.label}</span>
                  <span className="text-[8px] text-zinc-400 dark:text-zinc-600 font-mono hidden sm:block">[{btn.key}]</span>
                </button>
              );
            })}
          </motion.div>
        ) : (
          <motion.button
            key="show-answer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => setIsFlipped(true)}
            className="w-full py-3.5 rounded-xl sm:rounded-2xl bg-[#0071e3] hover:bg-[#005bb5] text-white font-extrabold text-sm shadow-xl shadow-[#0071e3]/20 transition active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Sparkles size={16} /> Mostrar Resposta
            <span className="text-[10px] font-mono text-blue-200/60 hidden sm:inline">[Espa\u00e7o]</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
