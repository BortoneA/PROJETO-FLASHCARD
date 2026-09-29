"use client";

import { useState, useRef, useMemo } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import RichToolbar from "./RichToolbar";
import DeckEditModal from "./DeckEditModal";
import Mascot from "./Mascot";
import {
  Plus, ArrowRight, Download, Trash2, Play,
  BookOpen, Flame, Gem, Crown, BarChart3,
  Image as ImageIcon, Upload, Loader2, Pencil,
  Search, X, CheckCircle2, Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnalyticsModal from "./AnalyticsModal";
import { useRouter } from "next/navigation";

export default function DeckManager({ decks, userProfile }: { decks: any[]; userProfile: any }) {
  const router = useRouter();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editingDeck, setEditingDeck] = useState<any | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "due" | "new">("all");

  // Create Deck form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("\uD83D\uDCDA");
  const [coverUrl, setCoverUrl] = useState("");

  // Create Card form state
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [extra, setExtra] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  // Aggregated metrics
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

  // Filtered decks
  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        deck.title.toLowerCase().includes(q) ||
        (deck.description && deck.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterTab === "due") return deck.dueCardsCount > 0;
      if (filterTab === "new") return deck.newCardsCount > 0;
      return true;
    });
  }, [decks, searchQuery, filterTab]);

  const decksWithDue = decks.filter((d) => d.dueCardsCount > 0);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createDeck(title, description, icon, undefined, coverUrl);
    setTitle("");
    setDescription("");
    setCoverUrl("");
    setIsModalOpen(false);
  };

  const handleImportApkg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import-apkg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro na importa\u00e7\u00e3o");
      }

      alert("Baralho importado com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
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
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* ═══════════ DUOLINGO MASCOT COMMAND BANNER ═══════════ */}
      <section className="card-duo bg-white dark:bg-[#18191c] p-5 sm:p-7 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Mascot with Dynamic Mood */}
          <div className="shrink-0 flex flex-col items-center">
            <Mascot
              size={110}
              mood={totalDueAll === 0 ? "cheering" : streak >= 3 ? "fire" : "happy"}
              className="hover:scale-105 transition-transform"
            />
          </div>

          {/* Duolingo Speech Bubble */}
          <div className="flex-1 w-full relative">
            <div className="bg-[#f0f9eb] dark:bg-[#1b2617] border-2 border-[#bcf096] dark:border-[#385c22] rounded-3xl p-5 sm:p-6 relative shadow-sm">
              {/* Speech bubble pointer triangle */}
              <div className="hidden md:block absolute -left-3 top-7 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-[#bcf096] dark:border-r-[#385c22] border-b-[8px] border-b-transparent" />
              <div className="hidden md:block absolute -left-2 top-7 w-0 h-0 border-t-[8px] border-t-transparent border-r-[11px] border-r-[#f0f9eb] dark:border-r-[#1b2617] border-b-[8px] border-b-transparent" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#46a302] dark:text-[#79d81d] flex items-center gap-1.5 mb-1">
                    <Sparkles size={14} />
                    {totalDueAll > 0 ? "Miss\u00e3o do Dia" : "Miss\u00e3o Cumprida!"}
                  </span>

                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {totalDueAll > 0 ? (
                      <span>
                        {"Voc\u00ea tem "}
                        <span className="text-[#58cc02]">{totalDueAll} cards</span>
                        {" para praticar hoje!"}
                      </span>
                    ) : (
                      <span>{"Tudo em dia! Voc\u00ea \u00e9 impar\u00e1vel! \uD83C\uDF89"}</span>
                    )}
                  </h1>

                  <p className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    {totalDueAll > 0
                      ? "Apenas 5 minutinhos para turbinar sua mem\u00f3ria e manter seu streak aceso!"
                      : "Excelente trabalho! Revise baralhos livres ou crie novos cards para sua pr\u00f3xima meta."}
                  </p>
                </div>
              </div>

              {/* Action Buttons Row with 3D Duolingo buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-[#d8f5be] dark:border-[#2a451b] mt-4">
                <Link
                  href="/study/all"
                  className={`btn-duo-green px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm ${
                    totalDueAll === 0 ? "opacity-90" : ""
                  }`}
                >
                  <Play size={16} className="fill-current" />
                  <span>{totalDueAll > 0 ? `Praticar Tudo (${totalDueAll})` : "Praticar Livremente"}</span>
                </Link>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-duo-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Novo Baralho</span>
                </button>

                <label className="btn-duo-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} strokeWidth={2.5} />}
                  <span>{isImporting ? "Importando..." : "Importar .APKG"}</span>
                  <input
                    type="file"
                    accept=".apkg"
                    className="hidden"
                    onChange={handleImportApkg}
                    disabled={isImporting}
                  />
                </label>

                <button
                  onClick={() => setIsAnalyticsOpen(true)}
                  className="btn-duo-blue px-5 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
                >
                  <BarChart3 size={16} strokeWidth={2.5} />
                  <span>Conquistas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ DUOLINGO 4-KPI TILES ═══════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tile 1: Due Cards */}
        <div className="card-duo bg-white dark:bg-[#18191c] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border-2 border-blue-300 dark:border-blue-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl shrink-0">
            {totalDueAll}
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              Para Revisar
            </span>
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
              {totalDueAll > 0 ? "Pendentes hoje" : "Zero pend\u00eancias"}
            </span>
          </div>
        </div>

        {/* Tile 2: Streak */}
        <div className="card-duo bg-white dark:bg-[#18191c] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-500 font-black text-xl shrink-0">
            <Flame size={24} className="fill-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Const\u00e2ncia
            </span>
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
              {streak} {streak === 1 ? "dia" : "dias"} seguidos!
            </span>
          </div>
        </div>

        {/* Tile 3: Gems / XP */}
        <div className="card-duo bg-white dark:bg-[#18191c] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 border-2 border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-black text-xl shrink-0">
            <Gem size={24} className="fill-cyan-500 text-cyan-500" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
              Cristais de XP
            </span>
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
              {xp} pontos
            </span>
          </div>
        </div>

        {/* Tile 4: Level & League */}
        <div className="card-duo bg-white dark:bg-[#18191c] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-yellow-100 dark:bg-yellow-950/60 border-2 border-yellow-300 dark:border-yellow-700/60 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-black text-xl shrink-0">
            <Crown size={24} className="fill-yellow-500 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400 block">
              Liga {level}
            </span>
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white truncate block">
              {rankTitle}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ SEARCH & FILTER TOOLBAR ═══════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Chunky Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar baralho por t\u00edtulo..."
            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[#18191c] rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#58cc02] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 3D Filter Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              filterTab === "all"
                ? "bg-[#58cc02] text-white border-b-4 border-[#46a302]"
                : "btn-duo-white"
            }`}
          >
            Todos ({decks.length})
          </button>
          <button
            onClick={() => setFilterTab("due")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              filterTab === "due"
                ? "bg-[#1cb0f6] text-white border-b-4 border-[#1899d6]"
                : "btn-duo-white"
            }`}
          >
            Pendentes ({decksWithDue.length})
          </button>
          <button
            onClick={() => setFilterTab("new")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              filterTab === "new"
                ? "bg-[#ff9600] text-white border-b-4 border-[#e58700]"
                : "btn-duo-white"
            }`}
          >
            Novos
          </button>
        </div>
      </div>

      {/* ═══════════ DECKS GRID (DUOLINGO STAGE TILES) ═══════════ */}
      {filteredDecks.length === 0 ? (
        <div className="card-duo bg-white dark:bg-[#18191c] p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-3 text-3xl">
            \uD83D\uDCD6
          </div>
          <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-200">
            {searchQuery ? "Nenhum baralho encontrado" : "Nenhum baralho criado ainda"}
          </h3>
          <p className="text-xs font-semibold text-zinc-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `Nenhum resultado corresponde a "${searchQuery}".`
              : "Crie seu primeiro baralho ou importe um arquivo .apkg do Anki para come\u00e7ar suas li\u00e7\u00f5es!"}
          </p>
          <button
            onClick={() => (searchQuery ? setSearchQuery("") : setIsModalOpen(true))}
            className="btn-duo-green px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider mt-5"
          >
            {searchQuery ? "Limpar Busca" : "Criar Primeiro Baralho"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="card-duo bg-white dark:bg-[#18191c] hover:-translate-y-1 transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-sm"
            >
              <div>
                {/* Deck Card Cover or Chunky Header */}
                {deck.coverUrl ? (
                  <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-800">
                    <img
                      src={deck.coverUrl}
                      alt={deck.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {/* Icon Bubble */}
                    <div className="absolute left-3.5 bottom-3 px-3 py-1.5 bg-white dark:bg-[#18191c] rounded-2xl text-xl shadow-md border-2 border-zinc-200 dark:border-zinc-700">
                      {deck.icon}
                    </div>
                    {/* Status Badge */}
                    {deck.dueCardsCount > 0 ? (
                      <span className="absolute right-3.5 top-3.5 px-3 py-1 bg-[#ff4b4b] border-b-2 border-[#ea2b2b] text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                        {deck.dueCardsCount} para hoje
                      </span>
                    ) : (
                      <span className="absolute right-3.5 top-3.5 px-3 py-1 bg-[#58cc02] border-b-2 border-[#46a302] text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                        Em dia!
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 pb-0 flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-3xl shadow-sm shrink-0">
                      {deck.icon}
                    </div>
                    {deck.dueCardsCount > 0 ? (
                      <span className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider rounded-xl">
                        {deck.dueCardsCount} para hoje
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-[#f0f9eb] dark:bg-[#1b2617] border-2 border-[#bcf096] dark:border-[#385c22] text-[#46a302] dark:text-[#79d81d] text-xs font-black uppercase tracking-wider rounded-xl">
                        Em dia
                      </span>
                    )}
                  </div>
                )}

                {/* Deck Card Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1">
                    {deck.title}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                    {deck.description || "Pratique os cards deste baralho para dominar o conte\u00fado!"}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 mt-4 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <span className="w-2 h-2 rounded-full bg-[#1cb0f6]" />
                      {deck.totalCards} cards
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <span className="w-2 h-2 rounded-full bg-[#58cc02]" />
                      {deck.newCardsCount} novos
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer with Duolingo Buttons */}
              <div className="p-3 sm:p-4 pt-0 border-t-2 border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                <Link
                  href={`/study/${deck.id}`}
                  className="flex-1 btn-duo-green py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Praticar</span>
                  <ArrowRight size={15} strokeWidth={3} />
                </Link>

                <button
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                    setIsCardModalOpen(true);
                  }}
                  className="btn-duo-white p-2 rounded-xl flex items-center justify-center"
                  title="Adicionar Card"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>

                <button
                  onClick={() => setEditingDeck(deck)}
                  className="btn-duo-white p-2 rounded-xl flex items-center justify-center"
                  title="Editar Baralho"
                >
                  <Pencil size={15} strokeWidth={2.5} />
                </button>

                <a
                  href={`/api/export-apkg?deckId=${deck.id}`}
                  download
                  className="btn-duo-white p-2 rounded-xl flex items-center justify-center"
                  title="Exportar .APKG"
                >
                  <Download size={15} strokeWidth={2.5} />
                </a>

                <button
                  onClick={() => handleDeleteDeck(deck.id)}
                  disabled={deletingId === deck.id}
                  className="btn-duo-white p-2 rounded-xl text-rose-500 hover:text-rose-600 flex items-center justify-center disabled:opacity-50"
                  title="Excluir Baralho"
                >
                  <Trash2 size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ MODAL: CRIAR BARALHO ═══════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-duo bg-white dark:bg-[#18191c] p-6 w-full max-w-md shadow-2xl transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mascot size={32} mood="cheering" />
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Criar Novo Baralho
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"\u00cdcone (Emoji)"}
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-16 p-2.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-center text-xl font-bold focus:border-[#58cc02] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"T\u00edtulo do Baralho"}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Espanhol B\u00e1sico, Medicina..."
                    className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold focus:border-[#58cc02] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Descri\u00e7\u00e3o (Opcional)"}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="O que voc\u00ea vai aprender neste baralho?"
                    rows={2}
                    className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:border-[#58cc02] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    URL da Capa (Opcional)
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold focus:border-[#58cc02] outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 btn-duo-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-duo-green py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm"
                  >
                    Criar Baralho
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL: CRIAR CARD ═══════════ */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
            onClick={() => setIsCardModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-duo bg-white dark:bg-[#18191c] p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-[#58cc02]" />
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Adicionar Novo Card
                  </h2>
                </div>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Frente (Pergunta)"}
                  </label>
                  <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:border-[#58cc02]">
                    <RichToolbar textareaRef={frontRef} value={front} onChange={setFront} />
                    <textarea
                      ref={frontRef}
                      required
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      placeholder="Ex: Como se diz 'ol\u00e1' em japon\u00eas?"
                      rows={2}
                      className="w-full p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-semibold outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Verso (Resposta)"}
                  </label>
                  <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:border-[#58cc02]">
                    <RichToolbar textareaRef={backRef} value={back} onChange={setBack} />
                    <textarea
                      ref={backRef}
                      required
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      placeholder="Ex: Konnichiwa (\u3053\u3093\u306b\u3061\u306f)"
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-semibold outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    URL da Imagem (Opcional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold focus:border-[#58cc02] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Dica ou Explica\u00e7\u00e3o Extra (Opcional)"}
                  </label>
                  <input
                    type="text"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Ex: Usado durante o dia como sauda\u00e7\u00e3o formal"
                    className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:border-[#58cc02] outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="flex-1 btn-duo-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-duo-green py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm"
                  >
                    Salvar Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ ANALYTICS MODAL ═══════════ */}
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />

      {/* ═══════════ EDIT DECK MODAL ═══════════ */}
      {editingDeck && (
        <DeckEditModal
          deck={editingDeck}
          isOpen={!!editingDeck}
          onClose={() => setEditingDeck(null)}
        />
      )}
    </div>
  );
}
