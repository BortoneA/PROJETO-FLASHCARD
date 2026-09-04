"use client";

import { useState } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import {
  Plus, Sparkles, ArrowRight, Download, Trash2, Zap, Play,
  Layers, BookOpen, Flame, Trophy, Award, Star, BarChart3,
  Image as ImageIcon, TrendingUp, Target, Clock
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnalyticsModal from "./AnalyticsModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.25 } },
};

export default function DeckManager({ decks, userProfile }: { decks: any[]; userProfile: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("\uD83D\uDCDA");

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [extra, setExtra] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const totalDueAll = decks.reduce((acc: number, d: any) => acc + d.dueCardsCount, 0);
  const totalCardsAll = decks.reduce((acc: number, d: any) => acc + d.totalCards, 0);

  const level = userProfile?.level || 1;
  const rankTitle = userProfile?.title || "Iniciante Curioso";
  const rankBadge = userProfile?.badge || "\uD83D\uDD25";
  const xp = userProfile?.xp || 0;
  const nextLevelXp = userProfile?.nextLevelXp || 100;
  const currentLevelMinXp = userProfile?.currentLevelMinXp || 0;
  const streak = userProfile?.streak || 1;

  const xpInCurrentLevel = xp - currentLevelMinXp;
  const xpNeededForLevel = nextLevelXp - currentLevelMinXp;
  const levelProgress = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / (xpNeededForLevel || 1)) * 100))
  );

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createDeck(title, description, icon);
    setTitle("");
    setDescription("");
    setIsModalOpen(false);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !front.trim() || !back.trim()) return;
    await createCard(selectedDeckId, front, back, extra, imageUrl);
    setFront("");
    setBack("");
    setExtra("");
    setImageUrl("");
    setIsCardModalOpen(false);
  };

  const handleDeleteDeck = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar este baralho e todos os seus cards?")) {
      setDeletingId(id);
      await deleteDeck(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 pb-12">
      {/* ═══════════ GAMIFICATION WIDGETS ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 sm:gap-4">
        {/* Level & XP Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800/80 shadow-xl transition-colors"
        >
          {/* Subtle glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#0071e3]/10 rounded-full blur-[60px] pointer-events-none animate-glow-pulse" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#0071e3] to-cyan-400 flex items-center justify-center text-white font-black text-lg sm:text-2xl shadow-lg shadow-[#0071e3]/25 shrink-0"
              >
                {rankBadge}
              </motion.div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#0071e3] flex items-center gap-1">
                  <Trophy size={12} className="text-amber-500 dark:text-amber-400 shrink-0" /> {"N\u00edvel"} {level}
                </span>
                <h3 className="text-sm sm:text-lg font-extrabold text-zinc-900 dark:text-white truncate transition-colors">
                  {rankTitle}
                </h3>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold block">XP Total</span>
              <span className="text-sm sm:text-lg font-black text-[#0071e3] dark:text-cyan-400 flex items-center justify-end gap-1 transition-colors">
                <Star size={13} className="fill-current text-amber-500 dark:text-amber-400" /> {xp}
              </span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="relative z-10 mt-4 space-y-1">
            <div className="flex justify-between text-[10px] sm:text-xs font-semibold text-zinc-500">
              <span>{"N\u00edvel"} {level + 1}</span>
              <span>{levelProgress}%</span>
            </div>
            <div className="w-full h-2 sm:h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-300/40 dark:border-zinc-700/40 transition-colors">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0071e3] via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(0,113,227,0.4)]"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-600 font-medium">
              {xpInCurrentLevel} / {xpNeededForLevel} XP para o {"pr\u00f3ximo n\u00edvel"}
            </p>
          </div>
        </motion.div>

        {/* Streak + Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800/80 shadow-xl flex flex-col justify-between min-w-0 md:min-w-[200px] transition-colors"
        >
          <div>
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400 flex items-center gap-1">
              <Flame size={13} /> {"Const\u00e2ncia"}
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tabular-nums transition-colors">{streak}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400/80">{"dias \uD83D\uDD25"}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 leading-relaxed">
              {"Estude diariamente para manter sua sequ\u00eancia!"}
            </p>
          </div>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="mt-3 w-full py-2 sm:py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-1.5 border border-amber-500/20 active:scale-95 touch-manipulation min-h-[40px]"
          >
            <BarChart3 size={14} /> {"Estat\u00edsticas"}
          </button>
        </motion.div>
      </div>

      {/* ═══════════ HERO BANNER ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-5 sm:p-8 lg:p-10 text-white shadow-2xl shadow-[#0071e3]/15 border border-blue-400/30 dark:border-white/10"
      >
        {/* Ambient blurs */}
        <div className="absolute -top-20 -right-20 w-56 sm:w-80 h-56 sm:h-80 bg-cyan-400/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 sm:w-80 h-56 sm:h-80 bg-pink-500/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-8">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase">
              <Sparkles size={12} className="text-cyan-300 animate-pulse" />
              <span>SM-2 Spaced Repetition</span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-200">
              Sua Central de Estudos
            </h1>

            <p className="text-blue-100/90 dark:text-blue-100/70 text-xs sm:text-sm font-normal leading-relaxed max-w-lg">
              {"Sincroniza\u00e7\u00e3o em tempo real com Neon DB. Revise baralhos individuais ou estude "}
              <span className="font-semibold text-white">todos os cards pendentes</span>.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-1 text-[10px] sm:text-xs font-semibold text-blue-100 dark:text-blue-200/80">
              <div className="flex items-center gap-1">
                <Layers size={13} className="text-cyan-300" />
                <span>{decks.length} Decks</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={13} className="text-indigo-300" />
                <span>{totalCardsAll} Cards</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-amber-300" />
                <span>{totalDueAll} Pendentes</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 pt-1 sm:pt-0 shrink-0">
            <Link
              href="/study/all"
              className="w-full sm:w-auto py-3 sm:py-3.5 px-5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-zinc-950 font-extrabold rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm min-h-[48px] touch-manipulation"
            >
              <Play size={16} className="fill-current" />
              <span>Estudar Todos ({totalDueAll})</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto py-3 sm:py-3.5 px-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl sm:rounded-2xl backdrop-blur-xl border border-white/15 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm min-h-[48px] touch-manipulation"
            >
              <Plus size={16} />
              <span>Novo Baralho</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════ DECK GRID ═══════════ */}
      {decks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 text-3xl sm:text-4xl transition-colors">
            {"\uD83D\uDCDA"}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-400 mb-1 transition-colors">Nenhum baralho ainda</h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-600 max-w-xs transition-colors">
            {"Crie seu primeiro baralho para come\u00e7ar a estudar com repeti\u00e7\u00e3o espa\u00e7ada."}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {decks.map((deck) => (
              <motion.div
                key={deck.id}
                layout
                variants={cardVariants}
                exit="exit"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg flex flex-col justify-between transition-colors hover:border-[#0071e3]/40 dark:hover:border-[#0071e3]/30 hover:shadow-[0_8px_30px_rgba(0,113,227,0.12)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl p-2.5 sm:p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-700/40 transition-colors">
                      {deck.icon}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {deck.dueCardsCount > 0 && (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 transition-colors">
                          {deck.dueCardsCount} pendentes
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteDeck(deck.id)}
                        disabled={deletingId === deck.id}
                        className="p-2 text-zinc-400 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                        title="Apagar Baralho"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#0071e3] transition-colors leading-snug">
                    {deck.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                    {deck.description || "Sem descri\u00e7\u00e3o dispon\u00edvel."}
                  </p>

                  <div className="flex items-center gap-2.5 mt-3 text-[10px] sm:text-[11px] text-zinc-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {deck.totalCards} cards
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700 transition-colors">{"•"}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {deck.newCardsCount} novos
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800/50 transition-colors">
                  <Link
                    href={`/study/${deck.id}`}
                    className="flex-1 py-2.5 sm:py-3 bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-[#0071e3]/15 active:scale-95 touch-manipulation min-h-[44px]"
                  >
                    Estudar <ArrowRight size={14} />
                  </Link>

                  <a
                    href={`/api/export-apkg?deckId=${deck.id}`}
                    download
                    className="p-2.5 sm:p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 dark:hover:text-white rounded-xl transition border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation"
                    title="Exportar .APKG"
                  >
                    <Download size={15} />
                  </a>

                  <button
                    onClick={() => {
                      setSelectedDeckId(deck.id);
                      setIsCardModalOpen(true);
                    }}
                    className="p-2.5 sm:p-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition border border-zinc-200 dark:border-zinc-700/40 flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation"
                    title="Adicionar Card"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══════════ MODAL: CRIAR DECK ═══════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
               initial={{ y: "100%", opacity: 0.5 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 30, stiffness: 300 }}
               className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl safe-bottom transition-colors"
               onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag handle */}
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden transition-colors" />

              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-4 transition-colors">Criar Novo Baralho</h2>
              <form onSubmit={handleCreateDeck} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{"\u00cdcone Emoji"}</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-lg text-center font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{`T\u00edtulo do Baralho`}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={"Ex: Medicina - Farmacologia"}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{`Descri\u00e7\u00e3o (Opcional)`}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Breve resumo do conte\u00fado deste deck`}
                    rows={2}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none resize-none transition-colors"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition min-h-[48px] touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] transition min-h-[48px] touch-manipulation"
                  >
                    Criar Baralho
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL: CRIAR CARD ═══════════ */}
      <AnimatePresence>
        {isCardModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsCardModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto safe-bottom transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag handle */}
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden transition-colors" />

              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 transition-colors">
                <ImageIcon size={18} className="text-[#0071e3]" />
                Adicionar Card
              </h2>
              <form onSubmit={handleCreateCard} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">Frente (Pergunta - Suporta Markdown)</label>
                  <input
                    type="text"
                    required
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder={`Qual a f\u00f3rmula da \u00e1gua?`}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">Verso (Resposta - Suporta Markdown)</label>
                  <textarea
                    required
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder={`H\u2082O - Composta por 2 Hidrog\u00eanios e 1 Oxig\u00eanio.`}
                    rows={2}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none resize-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">URL da Imagem (Opcional)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/diagrama.jpg"
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] text-xs transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{`Informa\u00e7\u00e3o Extra (Opcional)`}</label>
                  <input
                    type="text"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder={`Dica ou explica\u00e7\u00e3o detalhada`}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] transition-colors"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition min-h-[48px] touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] transition min-h-[48px] touch-manipulation"
                  >
                    Salvar Card
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ ANALYTICS MODAL ═══════════ */}
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
    </div>
  );
}
