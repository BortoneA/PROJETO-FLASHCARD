"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import { sound } from "@/lib/sound";
import { triggerConfetti, triggerStarBurst } from "@/lib/confetti";
import { speakText } from "@/lib/tts";
import {
  X, Flame, Gem, Star, Trophy, RotateCcw,
  Sparkles, CheckCircle2, ChevronRight, Volume2,
  Keyboard, Check, HelpCircle
} from "lucide-react";
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

  // Type-in Answer Mode State
  const [isTypeMode, setIsTypeMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hasSubmittedTyped, setHasSubmittedTyped] = useState(false);

  // Text-to-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Drag Gesture State
  const [dragOffset, setDragOffset] = useState(0);

  const [floatingXp, setFloatingXp] = useState<number | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{ level: number; title: string } | null>(null);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const progress = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;

  // Sound & Confetti on lesson completion
  const hasTriggeredEndRef = useRef(false);
  useEffect(() => {
    if (cards.length > 0 && currentIndex >= cards.length && !hasTriggeredEndRef.current) {
      hasTriggeredEndRef.current = true;
      sound.playLevelUp();
      triggerConfetti({ count: 90 });
    }
  }, [currentIndex, cards.length]);

  // Handle TTS
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playClick();
    setIsSpeaking(true);
    speakText(
      text,
      undefined,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleFlip = useCallback(() => {
    sound.playFlip();
    setIsFlipped((prev) => !prev);
  }, []);

  const handleAnswer = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard || isSyncing) return;

    setIsSyncing(true);

    if (rating >= 3) {
      sound.playSuccess(rating);
      if (rating === 4) {
        triggerConfetti({ count: 50, origin: { y: 0.75 } });
      }
    } else {
      sound.playError();
    }

    try {
      const res = await submitCardReview(currentCard.id, rating);

      if (res?.xpEarned) {
        setFloatingXp(res.xpEarned);
        setTimeout(() => setFloatingXp(null), 1400);
      }

      if (res?.didLevelUp) {
        sound.playLevelUp();
        triggerStarBurst();
        setLevelUpModal({ level: res.newLevel, title: res.newTitle });
      }
    } catch (err) {
      console.error("Erro na sincroniza\u00e7\u00e3o:", err);
    } finally {
      setIsSyncing(false);
    }

    setCompletedCount((prev) => prev + 1);
    if (rating >= 3) {
      setStreak((prev) => {
        const next = prev + 1;
        if (next >= 3 && next % 3 === 0) sound.playStreak();
        return next;
      });
    } else {
      setStreak(0);
    }

    // Reset card state for next card
    setIsFlipped(false);
    setTypedAnswer("");
    setHasSubmittedTyped(false);
    setDragOffset(0);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(cards.length);
    }
  }, [currentCard, isSyncing, currentIndex, cards.length]);

  // Type answer verification
  const handleVerifyTyped = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedAnswer.trim()) return;
    setHasSubmittedTyped(true);
    sound.playFlip();
    setIsFlipped(true);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input, let default typing happen
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.code === "Enter" && isTypeMode && !hasSubmittedTyped) {
          e.preventDefault();
          handleVerifyTyped();
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
        const ratingMap: Record<string, 1 | 2 | 3 | 4> = {
          Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4,
        };
        handleAnswer(ratingMap[e.code]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleAnswer, handleFlip, isTypeMode, hasSubmittedTyped, typedAnswer]);

  // ═══════════ COMPLETION SCREEN (DUOLINGO LESSON COMPLETE) ═══════════
  if (!currentCard || cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="card-duo bg-white dark:bg-[#182228] p-8 sm:p-10 max-w-md w-full shadow-xl transition-colors border-2 border-zinc-200 dark:border-[#28353d]"
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
              <div className="card-duo bg-zinc-50 dark:bg-[#131f24] border-zinc-200 dark:border-[#28353d] p-3.5">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">
                  Cards Revisados
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white">{completedCount}</span>
              </div>
              <div className="card-duo bg-amber-50 dark:bg-amber-500/15 border-2 border-amber-300 dark:border-amber-500/30 p-3.5">
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

  // Answer match calculation for Type Mode
  const isExactTypedMatch =
    hasSubmittedTyped &&
    typedAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();

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
              className="card-duo bg-white dark:bg-[#182228] border-2 border-zinc-200 dark:border-[#28353d] p-7 rounded-3xl shadow-2xl max-w-xs w-full text-center"
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
      <div className="w-full flex items-center gap-3 sm:gap-4 mb-3">
        {/* Close Button ✕ */}
        <Link
          href="/"
          className="w-10 h-10 rounded-2xl btn-duo-white flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0"
          title="Sair da li\u00e7\u00e3o"
        >
          <X size={20} strokeWidth={3} />
        </Link>

        {/* Duolingo Chunky Progress Bar */}
        <div className="flex-1 h-4 bg-zinc-200 dark:bg-[#131f24] rounded-full border-2 border-zinc-300 dark:border-[#28353d] p-0.5 overflow-hidden">
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
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border-2 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-xs shrink-0">
            <Flame size={14} className="fill-amber-500" />
            <span>{streak}</span>
          </div>
        )}
      </div>

      {/* Top Utility Bar: Mode Toggle & Instructions */}
      <div className="w-full flex items-center justify-between gap-2 mb-4 px-1">
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
          Card {currentIndex + 1} de {totalCards}
        </span>

        {/* Type Mode Toggle Button */}
        <button
          onClick={() => {
            sound.playClick();
            setIsTypeMode((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
            isTypeMode
              ? "bg-[#1cb0f6] text-white shadow-sm border-b-2 border-[#1899d6]"
              : "btn-duo-white text-zinc-500 dark:text-zinc-400"
          }`}
          title="Modo de Digita\u00e7\u00e3o"
        >
          <Keyboard size={14} strokeWidth={2.5} />
          <span>Modo Digitação {isTypeMode ? "Ativo" : "Off"}</span>
        </button>
      </div>

      {/* ═══════════ FLASHCARD EXERCISE TILE WITH GESTURE SWIPE ═══════════ */}
      <div className="w-full relative mb-6 touch-manipulation perspective-1000">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          onDrag={(e, info) => setDragOffset(info.offset.x)}
          onDragEnd={(e, info) => {
            if (info.offset.x > 110) {
              if (!isFlipped) {
                handleFlip();
              } else {
                handleAnswer(3); // Bom
              }
            } else if (info.offset.x < -110) {
              if (!isFlipped) {
                handleFlip();
              } else {
                handleAnswer(1); // Errei
              }
            }
            setDragOffset(0);
          }}
          className="w-full cursor-grab active:cursor-grabbing select-none relative"
        >
          {/* Swipe Stamp Badges (Duolingo / Tinder style) */}
          <AnimatePresence>
            {dragOffset > 40 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: Math.min(1, (dragOffset - 30) / 60), scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 left-6 z-30 border-4 border-[#58cc02] text-[#58cc02] font-black uppercase text-xl sm:text-2xl px-4 py-1.5 rounded-2xl rotate-[-12deg] bg-white/90 dark:bg-[#182228]/90 shadow-xl pointer-events-none"
              >
                ACERTEI ✓
              </motion.div>
            )}

            {dragOffset < -40 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: Math.min(1, (-dragOffset - 30) / 60), scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 right-6 z-30 border-4 border-[#ff4b4b] text-[#ff4b4b] font-black uppercase text-xl sm:text-2xl px-4 py-1.5 rounded-2xl rotate-[12deg] bg-white/90 dark:bg-[#182228]/90 shadow-xl pointer-events-none"
              >
                ERREI ✕
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCard.id}-${isFlipped ? "back" : "front"}`}
              initial={{ rotateY: isFlipped ? -45 : 45, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 45 : -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={!isTypeMode || isFlipped ? handleFlip : undefined}
              className="card-duo w-full min-h-[340px] sm:min-h-[400px] p-6 sm:p-8 bg-white dark:bg-[#182228] border-2 border-zinc-200 dark:border-[#28353d] flex flex-col items-center justify-between text-center shadow-md transition-colors relative"
            >
              {/* Card Image */}
              {currentCard.imageUrl && (
                <div className="mb-4 max-h-36 sm:max-h-44 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-[#28353d]">
                  <img
                    src={currentCard.imageUrl}
                    alt="Anexo"
                    className="h-full w-auto object-cover max-h-36 sm:max-h-44"
                  />
                </div>
              )}

              {!isFlipped ? (
                /* ─── FRONT (QUESTION) ─── */
                <div className="flex flex-col items-center justify-center w-full py-2 flex-1">
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <Mascot size={32} mood="happy" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#1cb0f6] bg-blue-50 dark:bg-blue-500/15 px-3 py-1 rounded-xl border-2 border-blue-200 dark:border-blue-500/30">
                        Pergunta
                      </span>
                    </div>

                    {/* Pronunciation TTS Button */}
                    <button
                      onClick={(e) => handleSpeak(currentCard.front, e)}
                      className={`p-2.5 rounded-2xl btn-duo-white text-zinc-500 hover:text-[#1cb0f6] transition-colors ${
                        isSpeaking ? "animate-pulse border-[#1cb0f6] text-[#1cb0f6]" : ""
                      }`}
                      title="Ouvir pron\u00fancia"
                    >
                      <Volume2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-relaxed break-words max-w-full prose-card my-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.front}</ReactMarkdown>
                  </div>

                  {/* Type Mode Input (Optional) */}
                  {isTypeMode && (
                    <div
                      className="w-full mt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <form onSubmit={handleVerifyTyped} className="flex gap-2">
                        <input
                          type="text"
                          value={typedAnswer}
                          onChange={(e) => setTypedAnswer(e.target.value)}
                          placeholder="Digite sua resposta aqui..."
                          className="flex-1 p-3 rounded-2xl border-2 border-zinc-200 dark:border-[#28353d] bg-zinc-50 dark:bg-[#131f24] text-zinc-900 dark:text-zinc-100 text-sm font-bold focus:border-[#58cc02] outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="btn-duo-green px-4 py-2 rounded-2xl font-black text-xs uppercase"
                        >
                          Checar
                        </button>
                      </form>
                    </div>
                  )}

                  <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 mt-6 flex items-center gap-1.5 uppercase tracking-wider">
                    <RotateCcw size={13} strokeWidth={2.5} />
                    <span>Toque ou deslize para ver a resposta</span>
                  </p>
                </div>
              ) : (
                /* ─── BACK (ANSWER) ─── */
                <div className="flex flex-col items-center justify-center w-full py-2 flex-1">
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <Mascot size={32} mood="cheering" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#58cc02] bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 rounded-xl border-2 border-emerald-200 dark:border-emerald-500/30">
                        Resposta
                      </span>
                    </div>

                    {/* Pronunciation TTS Button for Answer */}
                    <button
                      onClick={(e) => handleSpeak(currentCard.back, e)}
                      className={`p-2.5 rounded-2xl btn-duo-white text-zinc-500 hover:text-[#58cc02] transition-colors ${
                        isSpeaking ? "animate-pulse border-[#58cc02] text-[#58cc02]" : ""
                      }`}
                      title="Ouvir pron\u00fancia da resposta"
                    >
                      <Volume2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Type Comparison Feedback if user typed */}
                  {isTypeMode && hasSubmittedTyped && (
                    <div
                      className={`w-full p-3 mb-3 rounded-2xl border-2 text-xs font-bold text-left ${
                        isExactTypedMatch
                          ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="block text-[10px] font-black uppercase opacity-75">
                        {isExactTypedMatch ? "Acertou em cheio! 🎯" : "Sua Digitação:"}
                      </span>
                      <span className="text-sm font-black">{typedAnswer || "(vazio)"}</span>
                    </div>
                  )}

                  <div className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-relaxed mb-3 break-words max-w-full prose-card my-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.back}</ReactMarkdown>
                  </div>

                  {currentCard.extra && (
                    <div
                      className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-[#131f24] p-3.5 rounded-2xl border-2 border-zinc-200 dark:border-[#28353d] max-w-sm w-full prose-card text-left mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.extra}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
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
            onClick={handleFlip}
            className="w-full btn-duo-green py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
          >
            <span>Mostrar Resposta</span>
            <kbd className="text-xs bg-black/20 text-white px-2 py-0.5 rounded-lg hidden sm:inline">
              {"Espa\u00e7o"}
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
}
