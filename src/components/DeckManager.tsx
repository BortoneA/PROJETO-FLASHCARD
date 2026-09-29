"use client";

import { useState, useRef, useMemo } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import RichToolbar from "./RichToolbar";
import DeckEditModal from "./DeckEditModal";
import {
  Plus, ArrowRight, Download, Trash2, Play,
  Layers, BookOpen, Flame, Trophy, Star, BarChart3,
  Image as ImageIcon, Clock, Upload, Loader2, Pencil,
  Search, X, CheckCircle2, Sparkles, Filter
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
      {/* ═══════════ DASHBOARD OVERVIEW (COMMAND CENTER) ═══════════ */}
      <section className="bg-white dark:bg-zinc-900/90 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-7 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Greeting & Summary */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />
              <span>{"Sess\u00e3o de Estudo"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {totalDueAll > 0 ? (
                <span>
                  {"Voc\u00ea tem "}
                  <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-4">
                    {totalDueAll} cards
                  </span>
                  {" para revisar hoje."}
                </span>
              ) : (
                <span>{"Tudo em dia! Nenhum card pendente."}</span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {totalDueAll > 0
                ? "Estudos distribu\u00eddos com o algoritmo de repeti\u00e7\u00e3o espa\u00e7ada SM-2 para reten\u00e7\u00e3o de longo prazo."
                : "Voc\u00ea concluiu todas as revis\u00f5es agendadas. Aproveite para adicionar novos cards ou praticar baralhos espec\u00edficos."}
            </p>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                href="/study/all"
                className={`py-2.5 px-5 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 touch-manipulation min-h-[42px] ${
                  totalDueAll > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                    : "bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950"
                }`}
              >
                <Play size={14} className="fill-current" />
                <span>{totalDueAll > 0 ? `Estudar Todos (${totalDueAll})` : "Revisar Todos os Cards"}</span>
              </Link>

              <button
                onClick={() => setIsModalOpen(true)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl text-xs sm:text-sm border border-zinc-200/80 dark:border-zinc-700/80 transition-all flex items-center gap-1.5 min-h-[42px] touch-manipulation"
              >
                <Plus size={15} />
                <span>Novo Baralho</span>
              </button>

              <label className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl text-xs sm:text-sm border border-zinc-200/80 dark:border-zinc-700/80 transition-all flex items-center gap-1.5 min-h-[42px] touch-manipulation cursor-pointer">
                {isImporting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
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
                className="py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium rounded-xl text-xs sm:text-sm border border-zinc-200/50 dark:border-zinc-700/40 transition-all flex items-center gap-1.5 min-h-[42px] touch-manipulation"
              >
                <BarChart3 size={15} />
                <span>{"M\u00e9tricas"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Key Metric Strip (Human & Clean) */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-[360px] shrink-0">
            {/* Metric 1: Due Cards */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                Pendentes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {totalDueAll}
                </span>
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">cards</span>
              </div>
            </div>

            {/* Metric 2: Streak */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {"Const\u00e2ncia"}
                </span>
                <Flame size={14} className="text-amber-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {streak}
                </span>
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">dias</span>
              </div>
            </div>

            {/* Metric 3: Level & XP */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80 col-span-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{rankBadge}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{rankTitle}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">{"\u2022"} N\u00edvel {level}</span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px] tabular-nums">{xp} XP</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700/60 rounded-full overflow-hidden mt-2.5">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-600 dark:text-zinc-400 mt-1">
                <span>{xpInCurrentLevel} / {xpNeededForLevel} XP</span>
                <span>{levelProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SEARCH & FILTER TOOLBAR ═══════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar baralho por t\u00edtulo..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 self-start sm:self-auto">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Todos ({decks.length})
          </button>
          <button
            onClick={() => setFilterTab("due")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "due"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Pendentes ({decksWithDue.length})
          </button>
          <button
            onClick={() => setFilterTab("new")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "new"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Novos
          </button>
        </div>
      </div>

      {/* ═══════════ DECKS GRID ═══════════ */}
      {filteredDecks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/30">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <BookOpen size={20} />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            {searchQuery ? "Nenhum baralho encontrado" : "Nenhum baralho cadastrado"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `Nenhum resultado corresponde a "${searchQuery}". Tente outro termo ou limpe o filtro.`
              : "Crie seu primeiro baralho ou importe um arquivo .apkg do Anki para come\u00e7ar."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-200"
            >
              Limpar busca
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
            >
              Criar Baralho
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Deck Card Cover or Header Banner */}
                {deck.coverUrl ? (
                  <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200/80 dark:border-zinc-800">
                    <img
                      src={deck.coverUrl}
                      alt={deck.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {/* Icon Pill in bottom-left */}
                    <div className="absolute left-3 bottom-3 px-2.5 py-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl text-lg shadow-sm border border-white/20">
                      {deck.icon}
                    </div>
                    {/* Status Pill in top-right */}
                    {deck.dueCardsCount > 0 ? (
                      <span className="absolute right-3 top-3 px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {deck.dueCardsCount} para hoje
                      </span>
                    ) : (
                      <span className="absolute right-3 top-3 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-semibold rounded-full shadow-sm">
                        Em dia
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 pb-0 flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {deck.icon}
                    </div>
                    {deck.dueCardsCount > 0 ? (
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[11px] font-bold rounded-full">
                        {deck.dueCardsCount} para hoje
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold rounded-full">
                        Em dia
                      </span>
                    )}
                  </div>
                )}

                {/* Deck Card Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 min-h-[32px] leading-relaxed">
                    {deck.description || "Sem descri\u00e7\u00e3o fornecida."}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 mt-4 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {deck.totalCards} cards
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">{"\u2022"}</span>
                    <span>{deck.newCardsCount} novos</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 sm:p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5">
                <Link
                  href={`/study/${deck.id}`}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 touch-manipulation min-h-[38px]"
                >
                  <span>Estudar</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                    setIsCardModalOpen(true);
                  }}
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition min-w-[38px] min-h-[38px] flex items-center justify-center touch-manipulation"
                  title="Adicionar Card"
                >
                  <Plus size={16} />
                </button>

                <button
                  onClick={() => setEditingDeck(deck)}
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition min-w-[38px] min-h-[38px] flex items-center justify-center touch-manipulation"
                  title="Editar Baralho"
                >
                  <Pencil size={15} />
                </button>

                <a
                  href={`/api/export-apkg?deckId=${deck.id}`}
                  download
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition min-w-[38px] min-h-[38px] flex items-center justify-center touch-manipulation"
                  title="Exportar .APKG"
                >
                  <Download size={15} />
                </a>

                <button
                  onClick={() => handleDeleteDeck(deck.id)}
                  disabled={deletingId === deck.id}
                  className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition min-w-[38px] min-h-[38px] flex items-center justify-center touch-manipulation disabled:opacity-50"
                  title="Excluir Baralho"
                >
                  <Trash2 size={15} />
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
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-xl transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Criar Novo Baralho
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"\u00cdcone (Emoji)"}
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-16 p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-center text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"T\u00edtulo do Baralho"}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Medicina - Farmacologia"
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Descri\u00e7\u00e3o (Opcional)"}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve resumo do conte\u00fado deste baralho"
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"URL da Capa (Opcional)"}
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
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
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ImageIcon size={18} className="text-blue-600" />
                  Adicionar Flashcard
                </h2>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Frente (Pergunta / T\u00f3pico)"}
                  </label>
                  <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <RichToolbar textareaRef={frontRef} value={front} onChange={setFront} />
                    <textarea
                      ref={frontRef}
                      required
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      placeholder="Ex: O que \u00e9 repeti\u00e7\u00e3o espa\u00e7ada?"
                      rows={2}
                      className="w-full p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Verso (Resposta / Conte\u00fado)"}
                  </label>
                  <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <RichToolbar textareaRef={backRef} value={back} onChange={setBack} />
                    <textarea
                      ref={backRef}
                      required
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      placeholder="Ex: T\u00e9cnica de memoriza\u00e7\u00e3o baseada no aumento progressivo dos intervalos..."
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    URL da Imagem (Opcional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/diagrama.jpg"
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    {"Informa\u00e7\u00e3o Extra / Dica (Opcional)"}
                  </label>
                  <input
                    type="text"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Ex: Conceito proposto por Hermann Ebbinghaus"
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
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
