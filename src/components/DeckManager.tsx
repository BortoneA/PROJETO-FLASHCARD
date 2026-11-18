"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { createDeck, createCard, deleteDeck } from "@/app/actions/flashcards";
import RichToolbar from "./RichToolbar";
import DeckEditModal from "./DeckEditModal";
import ActivityHeatmap from "./ActivityHeatmap";
import SpeedRunModal from "./SpeedRunModal";
import XpShopModal from "./XpShopModal";
import { sound } from "@/lib/sound";
import { triggerConfetti } from "@/lib/confetti";
import {
  Plus, ArrowRight, Download, Trash2, Play,
  BookOpen, Flame, Crown, BarChart3,
  Image as ImageIcon, Upload, Loader2, Pencil,
  Search, X, CheckCircle2, Sparkles, Zap, Award,
  MoreVertical, ChevronDown, ChevronUp, LayoutGrid, List,
  Calendar, Layers, Clock, TrendingUp, Tag
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnalyticsModal from "./AnalyticsModal";
import { useRouter } from "next/navigation";
import { extractDeckTags, exportRetentionCSV } from "@/lib/exportRetentionCSV";

interface DeckManagerProps {
  decks: any[];
  userProfile: any;
  activityData?: Record<string, { count: number; goodCount: number }>;
  todayReviews?: number;
}

export default function DeckManager({
  decks,
  userProfile,
  activityData = {},
  todayReviews = 0,
}: DeckManagerProps) {
  const router = useRouter();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSpeedRunOpen, setIsSpeedRunOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importingDeckId, setImportingDeckId] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<any | null>(null);
  const [activeMenuDeckId, setActiveMenuDeckId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "cards" | "due" | "alpha">("recent");

  const [importResult, setImportResult] = useState<{
    decks: { title: string; importedCards: number; skippedDuplicates: number }[];
    totalImported: number;
    totalSkipped: number;
  } | null>(null);

  // Gamification & Skin state
  const [currentXp, setCurrentXp] = useState(userProfile?.xp || 0);

  useEffect(() => {
    if (userProfile?.xp !== undefined) {
      setCurrentXp(userProfile.xp);
    }
  }, [userProfile?.xp]);

  // Close card action menus on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-deck-menu]")) {
        setActiveMenuDeckId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenuDeckId(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "due" | "new">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags across decks with frequency count
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    decks.forEach((deck: any) => {
      const tags = extractDeckTags(deck);
      tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [decks]);

  // Create Deck form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📚");
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

  // Filtered & Sorted decks
  const filteredDecks = useMemo(() => {
    const list = decks.filter((deck) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        deck.title.toLowerCase().includes(q) ||
        (deck.description && deck.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterTab === "due") return deck.dueCardsCount > 0;
      if (filterTab === "new") return deck.newCardsCount > 0;

      if (selectedTag) {
        const deckTags = extractDeckTags(deck);
        if (!deckTags.includes(selectedTag)) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "cards") return b.totalCards - a.totalCards;
      if (sortBy === "due") return b.dueCardsCount - a.dueCardsCount;
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [decks, searchQuery, filterTab, sortBy, selectedTag]);

  const decksWithDue = decks.filter((d) => d.dueCardsCount > 0);
  const decksWithNew = decks.filter((d) => d.newCardsCount > 0);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createDeck(title, description, icon, undefined, coverUrl);
    setTitle("");
    setDescription("");
    setCoverUrl("");
    setIsModalOpen(false);
  };

  const handleImportApkg = async (e: React.ChangeEvent<HTMLInputElement>, targetDeckId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      if (targetDeckId) setImportingDeckId(targetDeckId);

      const formData = new FormData();
      formData.append("file", file);

      const mode = targetDeckId ? "merge" : "new";
      const url = targetDeckId
        ? `/api/import-apkg?mode=${mode}&deckId=${targetDeckId}`
        : `/api/import-apkg?mode=${mode}`;

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Falha na requisição (${res.status} ${res.statusText})` }));
        throw new Error(data.error || "Erro na importação");
      }

      const data = await res.json();
      setImportResult({
        decks: data.decks || [],
        totalImported: data.totalImported || 0,
        totalSkipped: data.totalSkipped || 0,
      });

      sound.playSuccess(4);
      triggerConfetti({ count: 65 });

      router.refresh();
    } catch (err: any) {
      sound.playError();
      alert(err.message || "Erro ao importar o arquivo .APKG. Verifique se o pacote é válido.");
    } finally {
      setIsImporting(false);
      setImportingDeckId(null);
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

  // Daily goal calculation
  const dailyGoalTarget = 15;
  const currentTodayReviews = todayReviews || 0;
  const dailyGoalPercent = Math.min(100, Math.round((currentTodayReviews / dailyGoalTarget) * 100));

  return (
    <div className="space-y-6 sm:space-y-7 pb-16">
      {/* ═══════════ EXECUTIVE COMMAND & OVERVIEW ═══════════ */}
      <section className="card-saas p-5 sm:p-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Column: Context & Headline */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistema de Repetição Espaçada
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                {decks.length} baralhos ativos
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {totalDueAll > 0 ? (
                <>
                  Você tem <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{totalDueAll} cartões</span> para revisar hoje.
                </>
              ) : (
                <>Revisões em dia. Nenhum cartão pendente agora.</>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {totalDueAll > 0
                ? `Tempo estimado para zerar sua fila: ~${Math.max(2, Math.ceil(totalDueAll * 0.4))} minutos de estudo ativo.`
                : "Excelente retenção de memória! Adicione novos cartões ou pratique livremente para antecipar revisões."}
            </p>
          </div>

          {/* Right Column: Daily Goal Precision Meter */}
          <div className="flex items-center gap-4 bg-muted/15 dark:bg-muted/10 p-3.5 sm:p-4 rounded-xl border border-border shrink-0 self-start lg:self-auto min-w-[240px]">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-border"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={currentTodayReviews >= dailyGoalTarget ? "#10b981" : "#3b82f6"}
                  strokeWidth="3.2"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={2 * Math.PI * 16 * (1 - dailyGoalPercent / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-foreground">
                {currentTodayReviews >= dailyGoalTarget ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  `${dailyGoalPercent}%`
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Meta Diária
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {currentTodayReviews}/{dailyGoalTarget}
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {currentTodayReviews >= dailyGoalTarget
                  ? "Meta diária alcançada ✓"
                  : `Faltam ${Math.max(0, dailyGoalTarget - currentTodayReviews)} cards hoje`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border mt-4">
          <Link
            href="/study/all"
            className="btn-saas-primary flex items-center gap-2"
          >
            <Play size={14} className="fill-current" />
            <span>{totalDueAll > 0 ? `Estudar Fila Completa (${totalDueAll})` : "Estudo Livre"}</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-saas-secondary flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Novo Baralho</span>
          </button>

          <label className="btn-saas-secondary flex items-center gap-1.5 cursor-pointer">
            {isImporting && !importingDeckId ? (
              <Loader2 size={14} className="animate-spin text-emerald-500" />
            ) : (
              <Upload size={14} />
            )}
            <span>{isImporting && !importingDeckId ? "Importando..." : "Importar .APKG"}</span>
            <input
              type="file"
              accept=".apkg,application/zip,application/x-zip-compressed,application/octet-stream"
              className="hidden"
              onChange={(e) => handleImportApkg(e)}
              disabled={isImporting}
            />
          </label>

          <button
            onClick={() => setIsSpeedRunOpen(true)}
            className="btn-saas-secondary flex items-center gap-1.5"
            title="Desafio Relâmpago 60s"
          >
            <Zap size={14} className="text-amber-500" />
            <span>Desafio 60s</span>
          </button>

          <button
            onClick={() => setIsShopOpen(true)}
            className="btn-saas-secondary flex items-center gap-1.5"
            title="Loja de Recompensas de Maestria"
          >
            <Award size={14} className="text-purple-500" />
            <span>Recompensas XP</span>
          </button>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="btn-saas-secondary flex items-center gap-1.5"
            title="Métricas de Retenção"
          >
            <BarChart3 size={14} className="text-blue-500" />
            <span>Métricas</span>
          </button>

          <button
            onClick={() => exportRetentionCSV({ decks, userProfile })}
            className="btn-saas-secondary flex items-center gap-1.5"
            title="Exportar Relatório Executivo CSV"
          >
            <Download size={14} className="text-emerald-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </section>

      {/* ═══════════ EXECUTIVE MANAGEMENT KPI METRICS ═══════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Due Cards */}
        <div className="card-saas p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Para Revisão Hoje</span>
            <Clock size={15} className="text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalDueAll}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {totalDueAll > 0 ? "prioridade alta" : "tudo em dia"}
            </span>
          </div>
        </div>

        {/* Metric 2: Streak */}
        <div className="card-saas p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Sequência de Consistência</span>
            <Flame size={15} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {streak}
            </span>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {streak === 1 ? "dia consecutivo" : "dias consecutivos"}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Cards */}
        <div className="card-saas p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Acervo Total</span>
            <Layers size={15} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalCardsAll}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              em {decks.length} baralhos
            </span>
          </div>
        </div>

        {/* Metric 4: Mastery Level */}
        <div className="card-saas p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Nível de Maestria</span>
            <Crown size={15} className="text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Nível {level}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {xp} XP
              </span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SEARCH, FILTER & VIEW CONTROLS ═══════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar baralho por título ou descrição..."
            className="w-full pl-9 pr-9 py-2 bg-surface rounded-lg border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right Tools: Filter Segment + Sort + View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tabs */}
          <div className="flex items-center bg-muted/15 dark:bg-muted/10 p-0.5 rounded-lg border border-border text-xs font-medium">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === "all"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({decks.length})
            </button>
            <button
              onClick={() => setFilterTab("due")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === "due"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pendentes ({decksWithDue.length})
            </button>
            <button
              onClick={() => setFilterTab("new")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === "new"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Novos ({decksWithNew.length})
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-surface border border-border rounded-lg text-xs font-medium px-2.5 py-1.5 text-muted-foreground focus:outline-none focus:border-primary/80"
          >
            <option value="recent">Mais Recentes</option>
            <option value="due">Mais Pendentes</option>
            <option value="cards">Maior Volume</option>
            <option value="alpha">Ordem Alfabética</option>
          </select>

          {/* View Mode Switcher: Grid vs Table */}
          <div className="flex items-center bg-muted/15 dark:bg-muted/10 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Grade de Cards"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Tabela de Gestão"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ MULTIFACETED TAG FILTER BAR ═══════════ */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground text-[11px] font-medium pr-1 shrink-0">
            <Tag size={12} className="text-emerald-500" />
            <span>Tags:</span>
          </div>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-all ${
              selectedTag === null
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            Todas ({decks.length})
          </button>
          {allTags.map(({ tag, count }) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/40"
                }`}
              >
                <span>{tag}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-[11px] text-rose-500 hover:text-rose-600 px-2 py-0.5 shrink-0 flex items-center gap-0.5 font-medium"
              title="Limpar filtro de tag"
            >
              <X size={11} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      )}

      {/* ═══════════ DECKS PRESENTATION (GRID OU TABELA) ═══════════ */}
      {filteredDecks.length === 0 ? (
        <div className="card-saas p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/20 border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <BookOpen size={24} strokeWidth={1.75} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery ? "Nenhum baralho encontrado" : "Nenhum baralho cadastrado"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            {searchQuery
              ? `Nenhum resultado corresponde a "${searchQuery}".`
              : "Crie seu primeiro baralho ou importe um arquivo .APKG do Anki para começar seu plano de estudos."}
          </p>
          <button
            onClick={() => (searchQuery ? setSearchQuery("") : setIsModalOpen(true))}
            className="btn-saas-primary mt-4"
          >
            {searchQuery ? "Limpar Busca" : "Criar Primeiro Baralho"}
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* ═══════════ DATA TABLE VIEW (ALTA DENSIDADE) ═══════════ */
        <div className="card-saas overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Baralho</th>
                  <th className="py-3 px-4 font-mono">Volume</th>
                  <th className="py-3 px-4 font-mono">Para Hoje</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredDecks.map((deck) => (
                  <tr key={deck.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-7 h-7 rounded-md bg-muted/20 border border-border flex items-center justify-center shrink-0">
                          {deck.icon}
                        </span>
                        <div>
                          <span className="font-semibold text-foreground block truncate max-w-xs sm:max-w-md">
                            {deck.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-xs">
                            {deck.description || "Sem descrição"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {deck.totalCards} cards
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {deck.dueCardsCount > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {deck.dueCardsCount}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {deck.dueCardsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Revisão Pendente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Em dia
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1 max-w-[180px]">
                        {extractDeckTags(deck).length > 0 ? (
                          extractDeckTags(deck).map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(selectedTag === tag ? null : tag);
                              }}
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                selectedTag === tag
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-semibold"
                                  : "bg-muted/15 border-border/80 text-muted-foreground hover:border-foreground/30"
                              }`}
                              title={`Filtrar por ${tag}`}
                            >
                              {tag}
                            </button>
                          ))
                        ) : (
                          <span className="text-muted-foreground/40 text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/study/${deck.id}`}
                          className="btn-saas-secondary py-1 px-2.5 text-xs font-semibold"
                        >
                          <span>Estudar</span>
                          <ArrowRight size={12} className="ml-1" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedDeckId(deck.id);
                            setIsCardModalOpen(true);
                          }}
                          className="btn-saas-secondary py-1 px-2"
                          title="Adicionar Card"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ═══════════ GRID VIEW (CARDS REFINADOS) ═══════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="card-saas card-saas-hover flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Deck Card Cover or Header */}
                {deck.coverUrl ? (
                  <div className="h-28 sm:h-32 w-full relative overflow-hidden bg-muted/20 border-b border-border">
                    <img
                      src={deck.coverUrl}
                      alt={deck.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute left-3 bottom-2.5 px-2 py-0.5 bg-surface/90 backdrop-blur-md rounded-md text-base shadow-xs border border-border">
                      {deck.icon}
                    </div>
                    {deck.dueCardsCount > 0 ? (
                      <span className="absolute right-3 top-3 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-semibold font-mono uppercase tracking-wider rounded-md shadow-xs">
                        {deck.dueCardsCount} para hoje
                      </span>
                    ) : (
                      <span className="absolute right-3 top-3 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold font-mono uppercase tracking-wider rounded-md shadow-xs">
                        Em dia
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 pb-0 flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/20 border border-border flex items-center justify-center text-xl shrink-0">
                      {deck.icon}
                    </div>
                    {deck.dueCardsCount > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-semibold rounded-md">
                        {deck.dueCardsCount} para hoje
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-semibold rounded-md">
                        Em dia
                      </span>
                    )}
                  </div>
                )}

                {/* Deck Card Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-1">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                    {deck.description || "Sem descrição cadastrada."}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 mt-3 text-[11px] font-mono font-medium text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-md bg-muted/15 border border-border/60">
                      {deck.totalCards} cards
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted/15 border border-border/60">
                      {deck.newCardsCount} novos
                    </span>
                  </div>

                  {/* Deck Tags */}
                  {extractDeckTags(deck).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2.5">
                      {extractDeckTags(deck).slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(selectedTag === tag ? null : tag);
                          }}
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                            selectedTag === tag
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-semibold"
                              : "bg-muted/15 border-border/80 text-muted-foreground hover:border-foreground/30"
                          }`}
                          title={`Filtrar por ${tag}`}
                        >
                          {tag}
                        </button>
                      ))}
                      {extractDeckTags(deck).length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          +{extractDeckTags(deck).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 sm:p-4 pt-0 border-t border-border flex items-center gap-1.5 relative">
                <Link
                  href={`/study/${deck.id}`}
                  className="flex-1 btn-saas-primary py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Estudar</span>
                  <ArrowRight size={13} />
                </Link>

                <button
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                    setIsCardModalOpen(true);
                  }}
                  className="btn-saas-secondary p-1.5 rounded-lg"
                  title="Adicionar Card Manualmente"
                >
                  <Plus size={15} />
                </button>

                {/* Dropdown Menu */}
                <div className="relative" data-deck-menu>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuDeckId(activeMenuDeckId === deck.id ? null : deck.id);
                    }}
                    className={`btn-saas-secondary p-1.5 rounded-lg transition-colors ${
                      activeMenuDeckId === deck.id ? "bg-muted/20" : ""
                    }`}
                    title="Mais opções do baralho"
                  >
                    <MoreVertical size={15} />
                  </button>

                  <AnimatePresence>
                    {activeMenuDeckId === deck.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 bottom-full mb-2 w-52 bg-surface border border-border rounded-xl shadow-lg z-30 p-1 space-y-0.5"
                      >
                        {/* Somar cards com .APKG */}
                        <label className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/20 rounded-lg cursor-pointer transition-colors">
                          <Upload size={14} className="text-emerald-500" />
                          <span className="flex-1">Somar cards (.APKG)</span>
                          <input
                            type="file"
                            accept=".apkg,application/zip,application/x-zip-compressed,application/octet-stream"
                            className="hidden"
                            onChange={(e) => {
                              setActiveMenuDeckId(null);
                              handleImportApkg(e, deck.id);
                            }}
                            disabled={isImporting}
                          />
                        </label>

                        {/* Editar Baralho */}
                        <button
                          onClick={() => {
                            setActiveMenuDeckId(null);
                            setEditingDeck(deck);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/20 rounded-lg transition-colors text-left"
                        >
                          <Pencil size={14} className="text-blue-500" />
                          <span>Editar baralho</span>
                        </button>

                        {/* Exportar .APKG */}
                        <a
                          href={`/api/export-apkg?deckId=${deck.id}`}
                          download
                          onClick={() => setActiveMenuDeckId(null)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/20 rounded-lg transition-colors"
                        >
                          <Download size={14} className="text-amber-500" />
                          <span>Exportar (.APKG)</span>
                        </a>

                        <div className="h-px bg-border my-1" />

                        {/* Excluir Baralho */}
                        <button
                          onClick={() => {
                            setActiveMenuDeckId(null);
                            handleDeleteDeck(deck.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                        >
                          <Trash2 size={14} />
                          <span>Excluir baralho</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ ACTIVITY HEATMAP (RETENTION & HISTORIC) ═══════════ */}
      <section className="card-saas p-4 sm:p-5 transition-colors">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Matriz de Consistência & Histórico
              </h3>
              <p className="text-xs text-muted-foreground">
                {showHeatmap ? "Exibindo os últimos 5 meses de retenção ativa" : "Clique para expandir o histórico de 147 dias"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {showHeatmap ? "Ocultar" : "Expandir"}
            </span>
            <div className="p-1 rounded-md text-muted-foreground group-hover:text-foreground">
              {showHeatmap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {showHeatmap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-4"
            >
              <ActivityHeatmap activityData={activityData} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ═══════════ MODAL: CRIAR BARALHO ═══════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="card-saas p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground">
                  Criar Novo Baralho
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Ícone Identificador
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-14 p-2 rounded-lg border border-border bg-surface text-foreground text-center text-lg font-bold focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Título do Baralho
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Farmacologia Clínica, Vocabulário Alemão..."
                    className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs sm:text-sm focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objetivo de aprendizado deste baralho..."
                    rows={2}
                    className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs sm:text-sm focus:border-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    URL da Capa (Opcional)
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs focus:border-primary outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 btn-saas-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-saas-primary"
                  >
                    Salvar Baralho
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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsCardModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="card-saas p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-emerald-500" />
                  <h2 className="text-base font-bold text-foreground">
                    Novo Flashcard
                  </h2>
                </div>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Frente (Pergunta / Prompt)
                  </label>
                  <div className="rounded-lg border border-border overflow-hidden focus-within:border-primary">
                    <RichToolbar textareaRef={frontRef} value={front} onChange={setFront} />
                    <textarea
                      ref={frontRef}
                      required
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      placeholder="Pergunta ou conceito a ser testado..."
                      rows={2}
                      className="w-full p-2.5 bg-surface text-foreground text-xs sm:text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Verso (Resposta / Solução)
                  </label>
                  <div className="rounded-lg border border-border overflow-hidden focus-within:border-primary">
                    <RichToolbar textareaRef={backRef} value={back} onChange={setBack} />
                    <textarea
                      ref={backRef}
                      required
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      placeholder="Resposta correta e explicação..."
                      rows={3}
                      className="w-full p-2.5 bg-surface text-foreground text-xs sm:text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    URL da Imagem (Opcional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Nota / Dica Adicional (Opcional)
                  </label>
                  <input
                    type="text"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Contexto ou mnemônica..."
                    className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs sm:text-sm focus:border-primary outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="flex-1 btn-saas-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-saas-primary"
                  >
                    Salvar Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL: ANALYTICS ═══════════ */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        decks={decks}
        userProfile={userProfile}
      />

      {/* ═══════════ MODAL: SPEED RUN ═══════════ */}
      <SpeedRunModal
        isOpen={isSpeedRunOpen}
        onClose={() => setIsSpeedRunOpen(false)}
        decks={decks}
        onSessionComplete={() => router.refresh()}
      />

      {/* ═══════════ MODAL: XP SHOP ═══════════ */}
      <XpShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        currentXp={currentXp}
        onXpChange={(newXp) => setCurrentXp(newXp)}
      />

      {/* ═══════════ MODAL: EDIT DECK ═══════════ */}
      {editingDeck && (
        <DeckEditModal
          deck={editingDeck}
          isOpen={!!editingDeck}
          onClose={() => setEditingDeck(null)}
        />
      )}

      {/* ═══════════ MODAL: RESULTADO IMPORTAÇÃO APKG ═══════════ */}
      <AnimatePresence>
        {importResult && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setImportResult(null)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="card-saas p-6 w-full max-w-md shadow-xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>

              <h2 className="text-lg font-bold text-foreground">
                Importação Concluída
              </h2>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                O pacote Anki foi processado e adicionado ao seu banco de dados com sucesso.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 rounded-lg bg-muted/15 border border-border">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                    Cards Adicionados
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{importResult.totalImported}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/15 border border-border">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                    Duplicatas Ignoradas
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-500">
                    {importResult.totalSkipped}
                  </span>
                </div>
              </div>

              {importResult.decks.length > 0 && (
                <div className="text-left bg-muted/10 p-3 rounded-lg border border-border max-h-36 overflow-y-auto mb-4 space-y-1.5 text-xs">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                    Baralhos Atualizados:
                  </span>
                  {importResult.decks.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center text-foreground">
                      <span className="truncate pr-2">{d.title}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 shrink-0 font-semibold">
                        +{d.importedCards}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setImportResult(null)}
                className="w-full btn-saas-primary"
              >
                Concluir
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
