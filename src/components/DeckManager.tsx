"use client";

import { useState } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import { Plus, BookOpen, Sparkles, Layers, ArrowRight, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DeckManager({ decks }: { decks: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⚡");

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [extra, setExtra] = useState("");

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
    if (confirm("Tem certeza que deseja excluir este baralho?")) {
      await deleteDeck(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner com Ação Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Anki Pro Engine + Neon DB
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Meus Baralhos de Estudo</h1>
          <p className="text-blue-100 text-sm mt-1">
            Algoritmo SM-2 com exportação em formato compatível Anki (.apkg) em tempo real.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-3 px-6 bg-white text-blue-600 font-bold rounded-2xl shadow-lg hover:bg-blue-50 transition active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} /> Novo Baralho
        </button>
      </div>

      {/* Grid de Decks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <motion.div
            key={deck.id}
            whileHover={{ y: -4 }}
            className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">{deck.icon}</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-full border border-emerald-500/20">
                    {deck.dueCardsCount} Para Revisar
                  </span>
                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 transition"
                    title="Excluir Baralho"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-[#0071e3] transition">
                {deck.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {deck.description || "Sem descrição disponível."}
              </p>

              <div className="flex items-center gap-4 mt-6 text-xs text-zinc-400 font-medium">
                <span>{deck.totalCards} cards totais</span>
                <span>•</span>
                <span>{deck.newCardsCount} novos</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Link
                href={`/study/${deck.id}`}
                className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#005bb5] text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-[#0071e3]/20"
              >
                Estudar <ArrowRight size={16} />
              </Link>
              <a
                href={`/api/export-apkg?deckId=${deck.id}`}
                download
                className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition flex items-center justify-center"
                title="Exportar como .APKG para Anki"
              >
                <Download size={18} />
              </a>
              <button
                onClick={() => {
                  setSelectedDeckId(deck.id);
                  setIsCardModalOpen(true);
                }}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl transition"
                title="Adicionar Card"
              >
                <Plus size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Criar Deck */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Criar Baralho</h2>
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Ícone Emoji</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Medicina - Farmacologia"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve resumo do conteúdo deste deck"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-xl hover:bg-zinc-200 transition"
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
          </div>
        </div>
      )}

      {/* Modal Criar Card */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Adicionar Card ao Baralho</h2>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Frente (Pergunta/Termo)</label>
                <input
                  type="text"
                  required
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: Qual é a função da Mitocôndria?"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Verso (Resposta)</label>
                <textarea
                  required
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Ex: Produção de ATP através da respiração celular."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Informação Extra (Opcional)</label>
                <input
                  type="text"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Ex: Conhecida como a usina de energia da célula."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-xl hover:bg-zinc-200 transition"
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
          </div>
        </div>
      )}
    </div>
  );
}
