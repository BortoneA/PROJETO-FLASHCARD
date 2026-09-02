"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import { Sparkles, CheckCircle2, RotateCcw, Flame, Zap, ArrowLeft, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Card {
  id: string;
  front: string;
  back: string;
  extra?: string | null;
  easeFactor: number;
  interval: number;
  deck?: {
    title: string;
    icon: string;
  };
}

export default function FlashcardDeck({
  deckId,
  deckTitle,
  initialCards,
}: {
  deckId: string;
  deckTitle: string;
  initialCards: Card[];
}) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [streak, setStreak] = useState(1);
  const [completedCount, setCompletedCount] = useState(0);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
        const ratingMap: Record<string, 1 | 2 | 3 | 4> = {
          Digit1: 1,
          Digit2: 2,
          Digit3: 3,
          Digit4: 4,
        };
        handleAnswer(ratingMap[e.code]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentCard]);

  const handleAnswer = async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard || isSyncing) return;

    setIsSyncing(true);

    if (rating === 4) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#0071e3", "#34c759", "#af52de", "#ff9500", "#5856d6"],
      });
    }

    try {
      await submitCardReview(currentCard.id, rating);
    } catch (err) {
      console.error("Erro na sincronização em tempo real:", err);
    } finally {
      setIsSyncing(false);
    }

    setCompletedCount((prev) => prev + 1);
    setStreak((prev) => prev + 1);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(cards.length);
    }
  };

  if (!currentCard || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-2">Sessão Concluída!</h2>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Você revisou <span className="font-bold text-emerald-500">{completedCount}</span> cards hoje com sincronização em tempo real!
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3.5 sm:py-4 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl hover:bg-zinc-200 transition text-center text-sm sm:text-base"
            >
              Voltar ao Início
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setCompletedCount(0);
              }}
              className="w-full py-3.5 sm:py-4 px-4 bg-[#0071e3] text-white font-bold rounded-2xl hover:bg-[#005bb5] transition flex items-center justify-center gap-2 shadow-lg shadow-[#0071e3]/30 text-sm sm:text-base"
            >
              <RotateCcw size={18} /> Estudar Novamente
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-8 flex flex-col items-center">
      {/* Header com Navegação e Stats - Otimizado Mobile */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition bg-zinc-900/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-zinc-800"
        >
          <ArrowLeft size={14} /> <span className="truncate max-w-[120px] sm:max-w-[200px]">{deckTitle}</span>
        </Link>

        <div className="flex items-center gap-2">
          {currentCard.deck && (
            <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[11px] font-bold border border-purple-500/20 truncate max-w-[100px]">
              <Layers size={12} /> {currentCard.deck.title}
            </span>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[11px] font-bold border border-amber-500/20">
            <Flame size={12} /> {streak}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#0071e3]/10 text-[#0071e3] rounded-full text-[11px] font-bold border border-[#0071e3]/20">
            <Zap size={12} /> Sync
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden mb-6 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Container do Card Otimizado para Touch */}
      <div
        className="w-full min-h-[300px] sm:min-h-[360px] cursor-pointer select-none mb-6 touch-manipulation"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <motion.div
          key={currentCard.id}
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full h-full rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 bg-zinc-900/90 backdrop-blur-3xl border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-[0.99]"
        >
          {/* LADO FRENTE (PERGUNTA) */}
          {!isFlipped ? (
            <div className="flex flex-col items-center justify-center py-4 w-full">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-[#0071e3] bg-[#0071e3]/10 px-3 py-1 rounded-full mb-4 sm:mb-6">
                Pergunta / Termo
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-snug break-words max-w-full">
                {currentCard.front}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-8 sm:mt-10 flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl">
                Toque no card para virar 🔄
              </p>
            </div>
          ) : (
            /* LADO VERSO (RESPOSTA) */
            <div className="flex flex-col items-center justify-center py-2 w-full animate-in fade-in duration-200">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-3 sm:mb-4">
                Resposta
              </span>
              <h3 className="text-xl sm:text-3xl font-bold text-white leading-relaxed mb-3 sm:mb-4 break-words max-w-full">
                {currentCard.back}
              </h3>
              {currentCard.extra && (
                <p className="text-xs sm:text-sm text-zinc-300 italic bg-zinc-800/80 p-3 sm:p-4 rounded-2xl border border-zinc-700/50 max-w-md">
                  {currentCard.extra}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Botões de Resposta Anki (SM-2) - Otimizados Touch de 44px+ */}
      <AnimatePresence>
        {isFlipped ? (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 15, opacity: 0 }}
            className="w-full grid grid-cols-4 gap-2 sm:gap-3"
          >
            <button
              onClick={() => handleAnswer(1)}
              className="group flex flex-col items-center py-3 sm:py-4 px-1 rounded-2xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all duration-150 active:scale-95 touch-manipulation min-h-[56px] justify-center"
            >
              <span className="text-[10px] sm:text-xs text-rose-300 font-medium">10 min</span>
              <span className="font-black text-xs sm:text-base">Again</span>
            </button>

            <button
              onClick={() => handleAnswer(2)}
              className="group flex flex-col items-center py-3 sm:py-4 px-1 rounded-2xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition-all duration-150 active:scale-95 touch-manipulation min-h-[56px] justify-center"
            >
              <span className="text-[10px] sm:text-xs text-amber-300 font-medium">1 dia</span>
              <span className="font-black text-xs sm:text-base">Hard</span>
            </button>

            <button
              onClick={() => handleAnswer(3)}
              className="group flex flex-col items-center py-3 sm:py-4 px-1 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all duration-150 active:scale-95 touch-manipulation min-h-[56px] justify-center"
            >
              <span className="text-[10px] sm:text-xs text-emerald-300 font-medium">3 dias</span>
              <span className="font-black text-xs sm:text-base">Good</span>
            </button>

            <button
              onClick={() => handleAnswer(4)}
              className="group flex flex-col items-center py-3 sm:py-4 px-1 rounded-2xl bg-[#0071e3]/15 hover:bg-[#0071e3] text-[#0071e3] hover:text-white border border-[#0071e3]/30 transition-all duration-150 active:scale-95 touch-manipulation min-h-[56px] justify-center"
            >
              <span className="text-[10px] sm:text-xs text-blue-300 font-medium">4 dias</span>
              <span className="font-black text-xs sm:text-base">Easy</span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-[#0071e3] hover:bg-[#005bb5] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#0071e3]/30 transition active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Sparkles size={18} /> Mostrar Resposta
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
