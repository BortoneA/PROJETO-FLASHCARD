"use client";

import { useState } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import { Plus, Sparkles, ArrowRight, Download, Trash2, Zap, Play, Layers, BookOpen, Flame, Trophy, Award, Star } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DeckManager({ decks, userProfile }: { decks: any[]; userProfile: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⚡");

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [extra, setExtra] = useState("");

  const totalDueAll = decks.reduce((acc, d) => acc + d.dueCardsCount, 0);
  const totalCardsAll = decks.reduce((acc, d) => acc + d.totalCards, 0);

  const level = userProfile?.level || 1;
  const xp = userProfile?.xp || 0;
  const nextLevelXp = userProfile?.nextLevelXp || 100;
  const streak = userProfile?.streak || 1;

  const levelProgress = Math.min(
    100,
    Math.max(0, Math.round(((xp - (level === 1 ? 0 : 100)) / (nextLevelXp - (level === 1 ? 0 : 100))) * 100))
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
    await createCard(selectedDeckId, front, back, extra);
    setFront("");
    setBack("");
    setExtra("");
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
    <div className="space-y-6 sm:space-y-10 pb-12">
      {/* Widget Gamificado de Nível & Constância (Apple Activity Style) - Mobile Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Nível e XP */}
        <div className="md:col-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-cyan-400 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-[#0071e3]/30">
                {level}
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#0071e3]">
                  Nível de Retenção
                </span>
                <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-1.5">
                  Mestre Anki Nível {level} <Trophy size={16} className="text-amber-400" />
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold block">XP Total</span>
              <span className="text-base sm:text-lg font-black text-cyan-400 flex items-center justify-end gap-1">
                <Star size={14} className="fill-current" /> {xp} XP
              </span>
            </div>
          </div>

          {/* Barra de XP */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-zinc-400">
              <span>Progresso para Nível {level + 1}</span>
              <span>{levelProgress}% ({xp} / {nextLevelXp} XP)</span>
            </div>
            <div className="w-full h-2.5 sm:h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0071e3] via-cyan-400 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Card de Constância (Streak) */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 p-5 sm:p-6 border border-amber-500/20 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <Flame size={14} /> Constância Diária
            </span>
            <Award size={18} className="text-amber-400" />
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
              <span>{streak}</span>
              <span className="text-xs sm:text-sm font-bold text-amber-400">Dias Seguidos 🔥</span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-1">
              Pratique diariamente para manter sua constância de aprendizado ativa!
            </p>
          </div>
        </div>
      </div>

      {/* Super Banner Apple Ultra Glossy - Responsivo Mobile */}
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-6 sm:p-10 text-white shadow-[0_20px_50px_-15px_rgba(0,113,227,0.4)] border border-white/20 backdrop-blur-3xl">
        <div className="absolute -top-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-400/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase">
              <Sparkles size={13} className="text-cyan-300 animate-pulse" />
              <span>Anki Pro SM-2 Engine</span>
            </div>

            <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-200">
              Sua Central de Estudos
            </h1>

            <p className="text-blue-100/80 text-xs sm:text-base font-normal leading-relaxed">
              Sincronização em tempo real no Neon DB. Revise baralhos individuais ou estude <span className="font-semibold text-white">todos os cards pendentes</span>.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 sm:pt-2 text-[11px] sm:text-xs font-semibold text-blue-200">
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-300" />
                <span>{decks.length} Decks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-300" />
                <span>{totalCardsAll} Cards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-300" />
                <span>{totalDueAll} Pendentes</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2 sm:pt-0">
            <Link
              href="/study/all"
              className="w-full sm:w-auto py-3.5 sm:py-4 px-5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-zinc-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Play size={18} className="fill-current" />
              <span>Estudar Todos ({totalDueAll})</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto py-3.5 sm:py-4 px-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-xl border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={18} />
              <span>Novo Baralho</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Decks Responsiva Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence>
          {decks.map((deck) => (
            <motion.div
              key={deck.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative bg-zinc-900/70 backdrop-blur-2xl border border-zinc-800 rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-7 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl sm:text-3xl p-3 bg-zinc-800/80 rounded-2xl border border-zinc-700/50">
                    {deck.icon}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-500/20">
                      {deck.dueCardsCount} Pendentes
                    </span>
                    <button
                      onClick={() => handleDeleteDeck(deck.id)}
                      disabled={deletingId === deck.id}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Apagar Baralho"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#0071e3] transition-colors">
                  {deck.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {deck.description || "Sem descrição disponível."}
                </p>

                <div className="flex items-center gap-3 mt-4 text-[11px] sm:text-xs text-zinc-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {deck.totalCards} cards
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {deck.newCardsCount} novos
                  </span>
                </div>
              </div>

              {/* Botões Otimizados para Toque */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/60">
                <Link
                  href={`/study/${deck.id}`}
                  className="flex-1 py-3 bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-[#0071e3]/20 active:scale-95 touch-manipulation min-h-[44px]"
                >
                  Estudar <ArrowRight size={15} />
                </Link>

                <a
                  href={`/api/export-apkg?deckId=${deck.id}`}
                  download
                  className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl transition border border-emerald-500/20 flex items-center justify-center min-h-[44px] min-w-[44px]"
                  title="Exportar .APKG para Anki"
                >
                  <Download size={16} />
                </a>

                <button
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                    setIsCardModalOpen(true);
                  }}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition border border-zinc-700/50 flex items-center justify-center min-h-[44px] min-w-[44px]"
                  title="Adicionar Card"
                >
                  <Plus size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Criar Deck */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-5">Criar Novo Baralho</h2>
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Ícone Emoji</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Título do Baralho</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Medicina - Farmacologia"
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve resumo do conteúdo deste deck"
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] transition"
                >
                  Criar Baralho
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Criar Card */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-5">Adicionar Card ao Baralho</h2>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Frente (Pergunta/Termo)</label>
                <input
                  type="text"
                  required
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: Qual é a função da Mitocôndria?"
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Verso (Resposta)</label>
                <textarea
                  required
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Ex: Produção de ATP através da respiração celular."
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Informação Extra (Opcional)</label>
                <input
                  type="text"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Ex: Conhecida como a usina de energia da célula."
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] transition"
                >
                  Salvar Card
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
