"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "@/lib/sound";
import { triggerConfetti } from "@/lib/confetti";
import { submitSpeedRunSession } from "@/app/actions/flashcards";
import {
  X, Zap, Timer, Flame, Star, Trophy,
  RotateCcw, Check, Sparkles, CheckCircle2
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

    const bonusXp = finalScore * 10 + finalMaxCombo * 5;
    setEarnedBonusXp(bonusXp);

    if (finalScore > 0) {
      sound.playLevelUp();
      triggerConfetti({ count: 60 });
    }

    try {
      setIsSubmitting(true);
      await submitSpeedRunSession(finalAnswered, finalScore, bonusXp);
      if (onSessionComplete) onSessionComplete();
    } catch (err) {
      console.error("Erro ao salvar sessão speed run:", err);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        className="card-saas w-full max-w-lg p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[440px] justify-between"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground z-10"
        >
          <X size={18} />
        </button>

        {/* ═══════════ STATE 1: READY SCREEN ═══════════ */}
        {gameState === "ready" && (
          <div className="flex flex-col items-center text-center my-auto py-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Zap size={24} />
            </div>

            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-1">
              Desafio Relâmpago
            </span>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
              Sprint de 60 Segundos
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
              Responda o máximo de cartões que puder em 60 segundos. Respostas corretas consecutivas ativam multiplicadores de combo e bônus de XP.
            </p>

            {cardsPool.length === 0 ? (
              <div className="p-3 rounded-lg border border-border bg-muted/10 text-xs text-muted-foreground mb-4">
                Adicione ao menos 1 cartão em seus baralhos para iniciar o desafio.
              </div>
            ) : (
              <button
                onClick={handleStart}
                className="w-full btn-saas-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Zap size={14} className="text-amber-400" />
                <span>Iniciar Sprint (60s)</span>
              </button>
            )}
          </div>
        )}

        {/* ═══════════ STATE 2: PLAYING SCREEN ═══════════ */}
        {gameState === "playing" && (
          <div className="flex flex-col flex-1 justify-between">
            {/* Top HUD */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border">
              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono font-bold text-xs ${
                  timeLeft <= 10
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse"
                    : "bg-muted/15 border-border text-foreground"
                }`}
              >
                <Timer size={13} />
                <span>{timeLeft}s</span>
              </div>

              {/* Combo Multiplier */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border font-mono text-xs ${
                  combo >= 3
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold"
                    : "bg-muted/15 border-border text-muted-foreground"
                }`}
              >
                <Flame size={13} className={combo >= 3 ? "fill-amber-500" : ""} />
                <span>Combo x{combo}</span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                <CheckCircle2 size={13} />
                <span>{score} pts</span>
              </div>
            </div>

            {/* Current Flashcard Card */}
            <div
              onClick={() => {
                sound.playFlip();
                setIsFlipped((prev) => !prev);
              }}
              className="w-full cursor-pointer select-none my-auto min-h-[200px] flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentIndex}-${isFlipped ? "back" : "front"}`}
                  initial={{ rotateY: isFlipped ? -25 : 25, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 25 : -25, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="w-full p-5 bg-muted/10 border border-border rounded-xl flex flex-col items-center justify-center text-center"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    {currentCard?.deckTitle || "Flashcard"} • {isFlipped ? "Resposta" : "Pergunta"}
                  </span>

                  <div className="text-base sm:text-lg font-semibold text-foreground leading-relaxed break-words max-w-full">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {isFlipped ? currentCard?.back || "" : currentCard?.front || ""}
                    </ReactMarkdown>
                  </div>

                  {!isFlipped && (
                    <span className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
                      <RotateCcw size={10} />
                      Espaço ou toque para ver resposta
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dual Action Grading Buttons */}
            <div className="pt-3 border-t border-border">
              {!isFlipped ? (
                <button
                  onClick={() => {
                    sound.playFlip();
                    setIsFlipped(true);
                  }}
                  className="w-full btn-saas-primary py-2 text-xs font-semibold"
                >
                  Ver Resposta [Espaço]
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAnswer(false)}
                    className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <X size={14} />
                    <span>Errei [1]</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
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
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Trophy size={24} />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              Sprint Finalizado
            </span>

            <h2 className="text-xl font-bold text-foreground mb-2">
              Resultado do Desafio
            </h2>

            <p className="text-xs text-muted-foreground mb-5">
              Excelente esforço de recall rápido em 60 segundos.
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 w-full mb-5 text-center font-mono">
              <div className="p-2.5 rounded-lg border border-border bg-muted/10">
                <span className="text-[10px] text-muted-foreground uppercase block">Respondidos</span>
                <span className="text-base font-bold text-foreground">{totalAnswered}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase block">Acertos</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{score}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase block">Combo Máx</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">{maxCombo}x</span>
              </div>
            </div>

            <div className="w-full bg-primary/10 border border-primary/20 p-2.5 rounded-lg text-xs font-mono font-semibold text-primary dark:text-blue-400 mb-5 flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>+{earnedBonusXp} XP Bônus Conquistados</span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleStart}
                className="flex-1 btn-saas-secondary text-xs"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-saas-primary text-xs"
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
