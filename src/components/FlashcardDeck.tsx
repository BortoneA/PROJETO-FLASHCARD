"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitCardReview } from "@/app/actions/flashcards";
import { sound } from "@/lib/sound";
import { triggerConfetti, triggerStarBurst } from "@/lib/confetti";
import { speakText } from "@/lib/tts";
import {
  X, Flame, Trophy, RotateCcw,
  CheckCircle2, Volume2, Keyboard, Check,
  ArrowRight, Sparkles, Layers, BookOpen, Clock
} from "lucide-react";
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
  {
    rating: 1 as const,
    label: "Errei",
    time: "~10m",
    key: "1",
    styles: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50"
  },
  {
    rating: 2 as const,
    label: "Difícil",
    time: "~1d",
    key: "2",
    styles: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
  },
  {
    rating: 3 as const,
    label: "Bom",
    time: "~3d",
    key: "3",
    styles: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
  },
  {
    rating: 4 as const,
    label: "Fácil",
    time: "~4d",
    key: "4",
    styles: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50"
  },
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
      triggerConfetti({ count: 70 });
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
        triggerConfetti({ count: 35, origin: { y: 0.8 } });
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
      console.error("Erro na sincronização:", err);
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
    setCurrentIndex((prev) => prev + 1);
  }, [currentCard, isSyncing]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing inside an input or textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === "1") handleAnswer(1);
        if (e.key === "2") handleAnswer(2);
        if (e.key === "3") handleAnswer(3);
        if (e.key === "4") handleAnswer(4);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleAnswer, isFlipped]);

  const handleVerifyTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    setHasSubmittedTyped(true);
    setIsFlipped(true);
  };

  // ═══════════ SESSION FINISHED SCREEN ═══════════
  if (currentIndex >= cards.length) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="card-saas p-7 sm:p-8 w-full shadow-lg text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Trophy size={24} />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
            Sessão Concluída
          </span>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {cards.length === 0 ? "Fila Zerada!" : "Revisões Concluídas"}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-5 leading-relaxed">
            {cards.length === 0 ? (
              <span>Nenhum cartão precisa de revisão no momento para este baralho.</span>
            ) : (
              <span>
                Você revisou com sucesso <strong className="text-foreground font-mono">{completedCount} cartões</strong>.
              </span>
            )}
          </p>

          {completedCount > 0 && (
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              <div className="p-3 rounded-lg bg-muted/15 border border-border">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Cartões Estudados
                </span>
                <span className="text-xl font-bold font-mono text-foreground">{completedCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider block">
                  Sequência Ativa
                </span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Flame size={16} className="fill-amber-500" /> {streak}d
                </span>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="w-full btn-saas-primary py-2.5 text-xs font-semibold block text-center"
          >
            Voltar ao Painel
          </Link>
        </motion.div>
      </div>
    );
  }

  // Answer match calculation for Type Mode
  const isExactTypedMatch =
    hasSubmittedTyped &&
    typedAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center relative min-h-screen">
      {/* Floating XP Notification */}
      <AnimatePresence>
        {floatingXp !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -15, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute top-14 z-40 bg-surface text-foreground px-3.5 py-1.5 rounded-full font-mono font-bold text-xs shadow-md border border-border flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>+{floatingXp} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Notification Modal */}
      <AnimatePresence>
        {levelUpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-saas p-6 rounded-xl shadow-xl max-w-xs w-full text-center"
            >
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                <Trophy size={24} />
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-amber-500">
                Avanço de Nível
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                Nível {levelUpModal.level}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {levelUpModal.title}
              </p>
              <button
                onClick={() => setLevelUpModal(null)}
                className="w-full btn-saas-primary text-xs"
              >
                Continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ TOP STUDY APP BAR ═══════════ */}
      <div className="w-full flex items-center justify-between gap-3 mb-2">
        <Link
          href="/"
          className="btn-saas-secondary p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          title="Sair do Estudo (Esc)"
        >
          <X size={16} />
        </Link>

        {/* Deck Title & Index */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
            {deckTitle}
          </span>
          <span>•</span>
          <span className="font-mono">{currentIndex + 1} de {totalCards}</span>
        </div>

        {/* Type Mode Toggle Button */}
        <button
          onClick={() => {
            sound.playClick();
            setIsTypeMode((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            isTypeMode
              ? "bg-primary/10 border-primary/30 text-primary"
              : "btn-saas-secondary text-muted-foreground"
          }`}
          title="Modo de Digitação"
        >
          <Keyboard size={13} />
          <span className="hidden sm:inline">Digitar</span>
        </button>
      </div>

      {/* Hairline Progress Bar */}
      <div className="w-full h-1 bg-border rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ═══════════ FLASHCARD SURFACE ═══════════ */}
      <div className="w-full relative mb-5 touch-manipulation perspective-1000">
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
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCard.id}-${isFlipped ? "back" : "front"}`}
              initial={{ rotateY: isFlipped ? -25 : 25, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 25 : -25, opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={!isTypeMode || isFlipped ? handleFlip : undefined}
              className="card-saas w-full min-h-[320px] sm:min-h-[380px] p-6 sm:p-8 flex flex-col justify-between text-left shadow-sm relative"
            >
              {/* Header inside card: Status Pill + TTS */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-border/60">
                <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  !isFlipped
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {!isFlipped ? "Pergunta" : "Resposta"}
                </span>

                <button
                  onClick={(e) => handleSpeak(!isFlipped ? currentCard.front : currentCard.back, e)}
                  className={`btn-saas-secondary p-1.5 rounded-md text-muted-foreground hover:text-foreground ${
                    isSpeaking ? "border-primary text-primary" : ""
                  }`}
                  title="Ouvir pronúncia (TTS)"
                >
                  <Volume2 size={15} />
                </button>
              </div>

              {/* Image if available */}
              {currentCard.imageUrl && (
                <div className="my-3 max-h-36 sm:max-h-44 rounded-lg overflow-hidden border border-border self-center">
                  <img
                    src={currentCard.imageUrl}
                    alt="Anexo do Flashcard"
                    className="h-full w-auto object-cover max-h-36 sm:max-h-44"
                  />
                </div>
              )}

              {/* Card Content Area */}
              <div className="my-auto py-4">
                {!isFlipped ? (
                  /* FRONT CONTENT */
                  <div className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed break-words prose-card">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.front}</ReactMarkdown>
                  </div>
                ) : (
                  /* BACK CONTENT */
                  <div className="space-y-3">
                    {/* Type feedback if active */}
                    {isTypeMode && hasSubmittedTyped && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs font-medium ${
                          isExactTypedMatch
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-mono uppercase block opacity-75">
                          {isExactTypedMatch ? "Acerto Exato ✓" : "Sua Digitação:"}
                        </span>
                        <span className="font-mono font-semibold">{typedAnswer || "(em branco)"}</span>
                      </div>
                    )}

                    <div className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed break-words prose-card">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.back}</ReactMarkdown>
                    </div>

                    {currentCard.extra && (
                      <div
                        className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border border-border/60 prose-card mt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.extra}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type mode form on front */}
              {!isFlipped && isTypeMode && (
                <div
                  className="w-full pt-3 border-t border-border/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <form onSubmit={handleVerifyTyped} className="flex gap-2">
                    <input
                      type="text"
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder="Digite sua resposta e pressione Enter..."
                      className="flex-1 p-2 rounded-lg border border-border bg-surface text-foreground text-xs font-mono focus:border-primary outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="btn-saas-primary text-xs py-1.5 px-3"
                    >
                      Checar
                    </button>
                  </form>
                </div>
              )}

              {/* Footer instruction */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RotateCcw size={12} />
                  <span>{!isFlipped ? "Clique ou pressione Espaço para virar" : "Avalie sua retenção abaixo"}</span>
                </span>
                <span className="font-mono text-[10px] hidden sm:inline">[Espaço]</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ═══════════ PRECISION SRS RATING CONTROLS ═══════════ */}
      <div className="w-full">
        {isFlipped ? (
          <div className="w-full grid grid-cols-4 gap-2">
            {ANSWER_BUTTONS.map((btn) => (
              <button
                key={btn.rating}
                onClick={() => handleAnswer(btn.rating)}
                disabled={isSyncing}
                className={`btn-keycap ${btn.styles} min-h-[58px] disabled:opacity-50`}
              >
                <span className="text-[10px] font-mono opacity-80">{btn.time}</span>
                <span className="text-xs sm:text-sm font-semibold">{btn.label}</span>
                <span className="text-[9px] font-mono opacity-70 hidden sm:inline">[{btn.key}]</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={handleFlip}
            className="w-full btn-saas-primary py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>Mostrar Resposta</span>
            <kbd className="font-mono text-[10px] bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded">
              Espaço
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
}
