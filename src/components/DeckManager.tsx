"use client";

import { useState } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import { Plus, Sparkles, ArrowRight, Download, Trash2, Zap, Play, Layers, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DeckManager({ decks }: { decks: any[] }) {
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
    <div className="space-y-10">
      {/* Super Banner Apple Ultra Glossy */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 sm:p-10 text-white shadow-[0_25px_60px_-15px_rgba(0,113,227,0.4)] border border-white/20 backdrop-blur-3xl">
        {/* Glows de Fundo Estilo visionOS */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-xs font-bold tracking-wider uppercase">
              <Sparkles size={14} className="text-cyan-300 animate-pulse" />
              <span>Anki Pro SM-2 Engine + Neon DB</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-200">
              Sua Central de Estudos
            </h1>

            <p className="text-blue-100/80 text-sm sm:text-base font-normal leading-relaxed">
              Sincronização instantânea a cada resposta. Revise baralhos individuais ou estude <span className="font-semibold text-white">todos os cards pendentes de uma vez só</span>.
            </p>

            <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-blue-200">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-cyan-300" />
                <span>{decks.length} Baralhos</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-300" />
                <span>{totalCardsAll} Cards Totais</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-300" />
                <span>{totalDueAll} Pendentes Hoje</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botão GLOBAL: Estudar TODOS os baralhos pendentes */}
            <Link
              href="/study/all"
              className="py-4 px-6 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-zinc-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 text-sm sm:text-base"
            >
              <Play size={20} className="fill-current" />
              <span>Estudar Todos ({totalDueAll})</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus size={20} />
              <span>Novo Baralho</span>
            </button>
          </div>
        </div>
      </div>

      {/* Título de Seção */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          Meus Baralhos <span className="text-xs text-zinc-400 font-normal">({decks.length})</span>
        </h2>
      </div>

      {/* Grid de Decks Estilo Apple Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {decks.map((deck) => (
            <motion.div
              key={deck.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="group relative bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] p-7 shadow-lg hover:shadow-2xl dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl p-3.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
                    {deck.icon}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 shadow-sm">
                      {deck.dueCardsCount} Pendentes
                    </span>
                    <button
                      onClick={() => handleDeleteDeck(deck.id)}
                      disabled={deletingId === deck.id}
                      className="p-2 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-200"
                      title="Apagar Baralho"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-[#0071e3] transition-colors">
                  {deck.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {deck.description || "Sem descrição disponível."}
                </p>

                <div className="flex items-center gap-4 mt-6 text-xs text-zinc-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {deck.totalCards} cards totais
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {deck.newCardsCount} novos
                  </span>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="flex items-center gap-2 mt-8 pt-5 border-t border-zinc-100 dark:border-zinc-800/60">
                <Link
                  href={`/study/${deck.id}`}
                  className="flex-1 py-3 bg-[#0071e3] hover:bg-[#005bb5] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#0071e3]/20 hover:shadow-[#0071e3]/40 active:scale-95"
                >
                  Estudar <ArrowRight size={16} />
                </Link>

                <a
                  href={`/api/export-apkg?deckId=${deck.id}`}
                  download
                  className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 rounded-xl transition duration-200 border border-emerald-500/20"
                  title="Exportar .APKG para Anki"
                >
                  <Download size={18} />
                </a>

                <button
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                    setIsCardModalOpen(true);
                  }}
                  className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl transition duration-200 border border-zinc-200/50 dark:border-zinc-700/50"
                  title="Adicionar Card"
                >
                  <Plus size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Criar Deck */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-7 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Criar Novo Baralho</h2>
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Ícone Emoji</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Título do Baralho</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Medicina - Farmacologia"
                  className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve resumo do conteúdo deste deck"
                  className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold rounded-xl hover:bg-zinc-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] shadow-lg shadow-[#0071e3]/30 transition"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-7 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Adicionar Card ao Baralho</h2>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Frente (Pergunta/Termo)</label>
                <input
                  type="text"
                  required
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: Qual é a função da Mitocôndria?"
                  className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Verso (Resposta)</label>
                <textarea
                  required
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Ex: Produção de ATP através da respiração celular."
                  className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">Informação Extra (Opcional)</label>
                <input
                  type="text"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Ex: Conhecida como a usina de energia da célula."
                  className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold rounded-xl hover:bg-zinc-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] shadow-lg shadow-[#0071e3]/30 transition"
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
