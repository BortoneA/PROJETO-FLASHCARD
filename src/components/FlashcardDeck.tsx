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
        particleCount: 60,
        spread: 70,
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
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Sessão Concluída!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Você revisou <span className="font-bold text-emerald-500">{completedCount}</span> cards hoje com sincronização em tempo real!
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-4 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl hover:bg-zinc-200 transition text-center"
            >
              Voltar ao Início
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setCompletedCount(0);
              }}
              className="w-full py-4 px-4 bg-[#0071e3] text-white font-bold rounded-2xl hover:bg-[#005bb5] transition flex items-center justify-center gap-2 shadow-lg shadow-[#0071e3]/30"
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
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2 rounded-full border border-zinc-200/50 dark:border-zinc-700/50"
        >
          <ArrowLeft size={16} /> {deckTitle}
        </Link>

        <div className="flex items-center gap-3">
          {currentCard.deck && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">
              <Layers size={13} /> {currentCard.deck.title}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold border border-amber-500/20">
            <Flame size={14} /> {streak} Streak
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0071e3]/10 text-[#0071e3] rounded-full text-xs font-bold border border-[#0071e3]/20">
            <Zap size={14} /> Sync Neon
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-8 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Container de Cartão de Estudo (Com exibição da Pergunta e da Resposta quando virado) */}
      <div
        className="w-full min-h-[380px] cursor-pointer select-none mb-8"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <motion.div
          key={currentCard.id}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full rounded-[2.5rem] p-8 sm:p-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-white/50 dark:border-zinc-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-[#0071e3]/40"
        >
          {/* LADO FRENTE (PERGUNTA) */}
          {!isFlipped ? (
            <div className="flex flex-col items-center justify-center py-6 w-full">
              <span className="text-xs uppercase tracking-widest font-extrabold text-[#0071e3] bg-[#0071e3]/10 px-3.5 py-1.5 rounded-full mb-6">
                Pergunta / Termo
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-snug">
                {currentCard.front}
              </h3>
              <p className="text-xs text-zinc-400 mt-10 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl">
                Clique ou Pressione <kbd className="px-2 py-0.5 bg-white dark:bg-zinc-700 rounded border border-zinc-300 dark:border-zinc-600 font-mono text-zinc-800 dark:text-zinc-200">Espaço</kbd> para virar
              </p>
            </div>
          ) : (
            /* LADO VERSO (RESPOSTA) */
            <div className="flex flex-col items-center justify-center py-4 w-full animate-in fade-in duration-300">
              <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-full mb-4">
                Resposta
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-relaxed mb-4">
                {currentCard.back}
              </h3>
              {currentCard.extra && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 italic bg-zinc-100/80 dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 max-w-md">
                  {currentCard.extra}
                </p>
              )}
            </div>
          )}
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
              className="group flex flex-col items-center py-4 px-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all duration-200 shadow-lg hover:shadow-rose-500/25 active:scale-95"
            >
              <span className="text-xs text-rose-400 group-hover:text-rose-100 font-medium">10 min</span>
              <span className="font-extrabold text-base">Again</span>
              <span className="text-[10px] opacity-60">Tecla 1</span>
            </button>

            <button
              onClick={() => handleAnswer(2)}
              className="group flex flex-col items-center py-4 px-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border border-amber-500/20 transition-all duration-200 shadow-lg hover:shadow-amber-500/25 active:scale-95"
            >
              <span className="text-xs text-amber-400 group-hover:text-amber-100 font-medium">1 dia</span>
              <span className="font-extrabold text-base">Hard</span>
              <span className="text-[10px] opacity-60">Tecla 2</span>
            </button>

            <button
              onClick={() => handleAnswer(3)}
              className="group flex flex-col items-center py-4 px-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 active:scale-95"
            >
              <span className="text-xs text-emerald-400 group-hover:text-emerald-100 font-medium">3 dias</span>
              <span className="font-extrabold text-base">Good</span>
              <span className="text-[10px] opacity-60">Tecla 3</span>
            </button>

            <button
              onClick={() => handleAnswer(4)}
              className="group flex flex-col items-center py-4 px-2 rounded-2xl bg-[#0071e3]/10 hover:bg-[#0071e3] text-[#0071e3] hover:text-white border border-[#0071e3]/20 transition-all duration-200 shadow-lg hover:shadow-[#0071e3]/25 active:scale-95"
            >
              <span className="text-xs text-blue-400 group-hover:text-blue-100 font-medium">4 dias</span>
              <span className="font-extrabold text-base">Easy</span>
              <span className="text-[10px] opacity-60">Tecla 4</span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsFlipped(true)}
            className="w-full py-4.5 rounded-2xl bg-[#0071e3] hover:bg-[#005bb5] text-white font-extrabold text-base shadow-xl shadow-[#0071e3]/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Sparkles size={20} /> Mostrar Resposta
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
