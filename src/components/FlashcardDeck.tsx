"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import { Sparkles, CheckCircle2, RotateCcw, Flame, Zap, ArrowLeft, Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Card {
  id: string;
  front: string;
  back: string;
  extra?: string | null;
  easeFactor: number;
  interval: number;
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
        colors: ["#0071e3", "#34c759", "#af52de", "#ff9500"],
      });
    }

    // Envia a resposta instantaneamente para o Neon PostgreSQL
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
      setCurrentIndex(cards.length); // Finalizou
    }
  };

  if (!currentCard || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Sessão Concluída!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Você revisou <span className="font-semibold text-emerald-500">{completedCount}</span> cards hoje com sincronização em tempo real!
          </p>

          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-xl hover:bg-zinc-200 transition"
            >
              Voltar ao Início
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setCompletedCount(0);
              }}
              className="flex-1 py-3 px-4 bg-[#0071e3] text-white font-medium rounded-xl hover:bg-[#005bb5] transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Estudar Novamente
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Header com Navegação e Stats */}
      <div className="w-full flex items-center justify-between mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={18} /> {deckTitle}
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-semibold">
            <Flame size={14} /> {streak} Streak
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0071e3]/10 text-[#0071e3] rounded-full text-xs font-semibold">
            <Zap size={14} /> Sync Neon Online
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card 3D Flip */}
      <div
        className="w-full h-[360px] cursor-pointer perspective-1000 select-none mb-8"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <motion.div
          className="relative w-full h-full rounded-3xl p-8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transform-gpu transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Frente do Card */}
          <div
            className={`absolute inset-0 p-8 flex flex-col items-center justify-center ${
              isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs uppercase tracking-widest font-semibold text-[#0071e3] mb-4">
              Pergunta / Termo
            </span>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-snug">
              {currentCard.front}
            </h3>
            <p className="text-xs text-zinc-400 mt-8 flex items-center gap-1.5">
              Clique ou Pressione <kbd className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">Espaço</kbd> para virar
            </p>
          </div>

          {/* Verso do Card */}
          <div
            className={`absolute inset-0 p-8 flex flex-col items-center justify-center ${
              isFlipped ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-500 mb-4">
              Resposta
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-relaxed mb-4">
              {currentCard.back}
            </h3>
            {currentCard.extra && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic bg-zinc-100/50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                {currentCard.extra}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Botões de Resposta Anki (SM-2) */}
      <AnimatePresence>
        {isFlipped ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full grid grid-cols-4 gap-3"
          >
            <button
              onClick={() => handleAnswer(1)}
              className="group flex flex-col items-center py-3.5 px-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all shadow-lg hover:shadow-rose-500/25 active:scale-95"
            >
              <span className="text-xs text-rose-400 group-hover:text-rose-100 font-medium">10 min</span>
              <span className="font-bold text-sm">Again</span>
              <span className="text-[10px] opacity-60">Tecla 1</span>
            </button>

            <button
              onClick={() => handleAnswer(2)}
              className="group flex flex-col items-center py-3.5 px-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border border-amber-500/20 transition-all shadow-lg hover:shadow-amber-500/25 active:scale-95"
            >
              <span className="text-xs text-amber-400 group-hover:text-amber-100 font-medium">1 dia</span>
              <span className="font-bold text-sm">Hard</span>
              <span className="text-[10px] opacity-60">Tecla 2</span>
            </button>

            <button
              onClick={() => handleAnswer(3)}
              className="group flex flex-col items-center py-3.5 px-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
            >
              <span className="text-xs text-emerald-400 group-hover:text-emerald-100 font-medium">3 dias</span>
              <span className="font-bold text-sm">Good</span>
              <span className="text-[10px] opacity-60">Tecla 3</span>
            </button>

            <button
              onClick={() => handleAnswer(4)}
              className="group flex flex-col items-center py-3.5 px-2 rounded-2xl bg-[#0071e3]/10 hover:bg-[#0071e3] text-[#0071e3] hover:text-white border border-[#0071e3]/20 transition-all shadow-lg hover:shadow-[#0071e3]/25 active:scale-95"
            >
              <span className="text-xs text-blue-400 group-hover:text-blue-100 font-medium">4 dias</span>
              <span className="font-bold text-sm">Easy</span>
              <span className="text-[10px] opacity-60">Tecla 4</span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-[#0071e3] hover:bg-[#005bb5] text-white font-bold text-base shadow-xl shadow-[#0071e3]/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Mostrar Resposta
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
