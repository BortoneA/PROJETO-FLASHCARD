"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "@/lib/sound";
import { triggerConfetti } from "@/lib/confetti";
import { submitSpeedRunSession } from "@/app/actions/flashcards";
import Mascot from "./Mascot";
import {
  X, Zap, Timer, Flame, Star, Trophy,
  RotateCcw, Check, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CardItem {
  id: string;
  front: string;
  back: string;
  extra?: string | null;
  deckTitle?: string;
}

interface SpeedRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: any[];
  onSessionComplete?: () => void;
}

export default function SpeedRunModal({
  isOpen,
  onClose,
  decks,
  onSessionComplete,
}: SpeedRunModalProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedBonusXp, setEarnedBonusXp] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Flatten and shuffle all cards from available decks
  const cardsPool: CardItem[] = useMemo(() => {
    const all: CardItem[] = [];
    decks.forEach((deck) => {
      if (deck.cards && Array.isArray(deck.cards)) {
        deck.cards.forEach((c: any) => {
          all.push({
            id: c.id,
            front: c.front,
            back: c.back,
            extra: c.extra,
            deckTitle: deck.title,
          });
        });
      }
    });

    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [decks, isOpen]);

  const currentCard = cardsPool[currentIndex % (cardsPool.length || 1)];

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState("ready");
      setTimeLeft(60);
      setCurrentIndex(0);
      setIsFlipped(false);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setTotalAnswered(0);
      setEarnedBonusXp(0);
    }
  }, [isOpen]);

  // Finish game callback
  const handleFinish = useCallback(async (finalScore: number, finalAnswered: number, finalMaxCombo: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("finished");

    // Bonus XP formula: 10 XP per correct + combo bonus
    const bonusXp = finalScore * 10 + finalMaxCombo * 5;
    setEarnedBonusXp(bonusXp);

    if (finalScore > 0) {
      sound.playLevelUp();
      triggerConfetti({ count: 80 });
    }

    try {
      setIsSubmitting(true);
      await submitSpeedRunSession(finalAnswered, finalScore, bonusXp);
      if (onSessionComplete) onSessionComplete();
    } catch (err) {
      console.error("Erro ao salvar sess\u00e3o speed run:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSessionComplete]);

  // Start game
  const handleStart = () => {
    if (cardsPool.length === 0) return;
    sound.playClick();
    setGameState("playing");
    setTimeLeft(60);
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTotalAnswered(0);
  };

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish(score, totalAnswered, maxCombo);
          return 0;
        }
        if (prev <= 11) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, score, totalAnswered, maxCombo, handleFinish]);

  // Handle Answer
  const handleAnswer = (isCorrect: boolean) => {
    if (gameState !== "playing" || !currentCard) return;

    const newTotal = totalAnswered + 1;
    setTotalAnswered(newTotal);

    if (isCorrect) {
      const newCombo = combo + 1;
      const newScore = score + 1;
      setScore(newScore);
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      if (newCombo >= 3 && newCombo % 3 === 0) {
        sound.playStreak();
      } else {
        sound.playSuccess(3);
      }
    } else {
      setCombo(0);
      sound.playError();
    }

    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  // Keyboard shortcut: Space (flip), 1 (Errei), 2 (Acertei)
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        sound.playFlip();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "Digit1" || e.code === "ArrowLeft") {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.code === "Digit2" || e.code === "ArrowRight") {
        e.preventDefault();
        handleAnswer(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isFlipped, combo, score, totalAnswered, maxCombo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="card-duo bg-white dark:bg-[#182228] border-2 border-zinc-200 dark:border-[#28353d] w-full max-w-lg p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col min-h-[460px] justify-between"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl btn-duo-white text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 z-10"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* ═══════════ STATE 1: READY SCREEN ═══════════ */}
        {gameState === "ready" && (
          <div className="flex flex-col items-center text-center my-auto py-4">
            <div className="mb-4">
              <Mascot size={110} mood="fire" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#ff9600] bg-amber-50 dark:bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-500/30 flex items-center gap-1.5">
                <Zap size={14} className="fill-current text-[#ff9600]" />
                Desafio Relâmpago 60s
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 mb-2">
              {"Corrida de Flashcards!"}
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 max-w-sm mb-6 leading-relaxed">
              {"Responda o m\u00e1ximo de cards que puder em "}
              <strong className="text-[#ff9600]">60 segundos</strong>
              {". Acertos em sequ\u00eancia criam combos que multiplicam seu XP!"}
            </p>

            {cardsPool.length === 0 ? (
              <div className="card-duo bg-amber-50 dark:bg-amber-500/10 border border-amber-300 p-4 rounded-2xl text-amber-700 dark:text-amber-400 text-xs font-bold mb-4">
                {"Voc\u00ea precisa criar ao menos 1 card para disputar o Desafio Rel\u00e2mpago!"}
              </div>
            ) : (
              <button
                onClick={handleStart}
                className="w-full btn-duo-orange py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
              >
                <Zap size={18} className="fill-current" />
                <span>Começar Desafio (60s)</span>
              </button>
            )}
          </div>
        )}

        {/* ═══════════ STATE 2: PLAYING SCREEN ═══════════ */}
        {gameState === "playing" && (
          <div className="flex flex-col flex-1 justify-between">
            {/* Top HUD */}
            <div className="flex items-center justify-between gap-2 mb-4">
              {/* Timer Pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 font-black text-xs sm:text-sm transition-colors ${
                  timeLeft <= 10
                    ? "bg-rose-50 dark:bg-rose-500/20 border-rose-400 text-rose-600 dark:text-rose-400 animate-pulse"
                    : "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                }`}
              >
                <Timer size={16} strokeWidth={2.5} />
                <span>{timeLeft}s</span>
              </div>

              {/* Combo Multiplier */}
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border-2 font-black text-xs sm:text-sm transition-all ${
                  combo >= 3
                    ? "bg-amber-100 dark:bg-amber-500/20 border-amber-400 text-amber-600 dark:text-amber-400 scale-105"
                    : "bg-zinc-100 dark:bg-[#131f24] border-zinc-200 dark:border-[#28353d] text-zinc-500"
                }`}
              >
                <Flame size={16} className={combo >= 3 ? "fill-amber-500 text-amber-500" : ""} />
                <span>Combo x{combo}</span>
              </div>

              {/* Score Points */}
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm">
                <Star size={15} className="fill-emerald-500" />
                <span>{score}</span>
              </div>
            </div>

            {/* Current Flashcard Card */}
            <div
              onClick={() => {
                sound.playFlip();
                setIsFlipped((prev) => !prev);
              }}
              className="w-full cursor-pointer select-none my-2 min-h-[220px] sm:min-h-[260px] flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentIndex}-${isFlipped ? "back" : "front"}`}
                  initial={{ rotateY: isFlipped ? -45 : 45, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 45 : -45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="card-duo w-full h-full p-6 bg-zinc-50 dark:bg-[#131f24] border-2 border-zinc-200 dark:border-[#28353d] rounded-3xl flex flex-col items-center justify-center text-center shadow-sm"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                    {currentCard?.deckTitle || "Flashcard"} • {isFlipped ? "Resposta" : "Pergunta"}
                  </span>

                  <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-relaxed break-words max-w-full">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {isFlipped ? currentCard?.back || "" : currentCard?.front || ""}
                    </ReactMarkdown>
                  </div>

                  {!isFlipped && (
                    <span className="text-[11px] font-bold text-zinc-400 mt-4 flex items-center gap-1">
                      <RotateCcw size={12} />
                      Toque para ver a resposta
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dual Action Grading Buttons */}
            <div className="pt-2">
              {!isFlipped ? (
                <button
                  onClick={() => {
                    sound.playFlip();
                    setIsFlipped(true);
                  }}
                  className="w-full btn-duo-blue py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider"
                >
                  Ver Resposta [Espaço]
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAnswer(false)}
                    className="btn-duo-red py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <X size={18} strokeWidth={3} />
                    <span>Errei [1]</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="btn-duo-green py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Check size={18} strokeWidth={3} />
                    <span>Acertei [2]</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ STATE 3: FINISHED SCREEN ═══════════ */}
        {gameState === "finished" && (
          <div className="flex flex-col items-center text-center my-auto py-2">
            <div className="mb-3">
              <Mascot size={110} mood="cheering" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-[#58cc02]">
              {"Tempo Esgotado!"}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 mb-2">
              {"Sensacional!"}
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-5">
              {"Voc\u00ea completou o Desafio Rel\u00e2mpago de 60 segundos com sucesso."}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 w-full mb-6">
              <div className="card-duo bg-zinc-50 dark:bg-[#131f24] border-zinc-200 dark:border-[#28353d] p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-500 font-black uppercase block">Respondidos</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white">{totalAnswered}</span>
              </div>

              <div className="card-duo bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 p-3 rounded-2xl">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase block">Acertos</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{score}</span>
              </div>

              <div className="card-duo bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30 p-3 rounded-2xl">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase block">Maior Combo</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
                  <Flame size={14} className="fill-amber-500" /> {maxCombo}
                </span>
              </div>
            </div>

            {/* XP Badge Banner */}
            <div className="w-full bg-[#ffc800] text-zinc-950 p-3.5 rounded-2xl font-black text-sm mb-6 flex items-center justify-center gap-2 border-2 border-yellow-300 shadow-md">
              <Star size={18} className="fill-current text-zinc-950" />
              <span>+{earnedBonusXp} Cristais de XP Bônus Conquistados!</span>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleStart}
                className="flex-1 btn-duo-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} strokeWidth={2.5} />
                <span>Tentar Novamente</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-duo-green py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
