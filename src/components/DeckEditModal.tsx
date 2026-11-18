"use client";

import { useState, useRef } from "react";
import { updateDeck, updateCard, deleteCard, getCardsForDeck } from "@/app/actions/flashcards";
import {
  X, Pencil, Trash2, Save, ChevronDown, ChevronUp,
  Settings, BookOpen, Loader2, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RichToolbar from "./RichToolbar";
import { useRouter } from "next/navigation";

interface DeckEditModalProps {
  deck: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeckEditModal({ deck, isOpen, onClose }: DeckEditModalProps) {
  const router = useRouter();

  // Deck edit state
  const [deckTitle, setDeckTitle] = useState(deck.title);
  const [deckDescription, setDeckDescription] = useState(deck.description || "");
  const [deckIcon, setDeckIcon] = useState(deck.icon);
  const [deckCoverUrl, setDeckCoverUrl] = useState(deck.coverUrl || "");
  const [savingDeck, setSavingDeck] = useState(false);

  // Cards state
  const [cards, setCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [showCards, setShowCards] = useState(false);

  // Edit card state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editExtra, setEditExtra] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const editFrontRef = useRef<HTMLTextAreaElement>(null);
  const editBackRef = useRef<HTMLTextAreaElement>(null);

  const loadCards = async () => {
    if (cardsLoaded) {
      setShowCards(!showCards);
      return;
    }
    setLoadingCards(true);
    try {
      const fetchedCards = await getCardsForDeck(deck.id);
      setCards(fetchedCards);
      setCardsLoaded(true);
      setShowCards(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleSaveDeck = async () => {
    setSavingDeck(true);
    try {
      await updateDeck(deck.id, {
        title: deckTitle,
        description: deckDescription || null,
        icon: deckIcon,
        coverUrl: deckCoverUrl || null,
      });
      router.refresh();
      onClose();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingDeck(false);
    }
  };

  const startEditCard = (card: any) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditExtra(card.extra || "");
    setEditImageUrl(card.imageUrl || "");
  };

  const cancelEditCard = () => {
    setEditingCardId(null);
    setEditFront("");
    setEditBack("");
    setEditExtra("");
    setEditImageUrl("");
  };

  const handleSaveCard = async (cardId: string) => {
    setSavingCard(true);
    try {
      await updateCard(cardId, {
        front: editFront,
        back: editBack,
        extra: editExtra || null,
        imageUrl: editImageUrl || null,
      });
      setCards(
        cards.map((c) =>
          c.id === cardId
            ? { ...c, front: editFront, back: editBack, extra: editExtra, imageUrl: editImageUrl }
            : c
        )
      );
      setEditingCardId(null);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao salvar card: " + err.message);
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Tem certeza que deseja apagar este card?")) return;
    setDeletingCardId(cardId);
    try {
      await deleteCard(cardId);
      setCards(cards.filter((c) => c.id !== cardId));
      router.refresh();
    } catch (err: any) {
      alert("Erro ao deletar: " + err.message);
    } finally {
      setDeletingCardId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="card-saas p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Settings size={18} className="text-primary" />
              Editar Baralho
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* ═══ DECK FIELDS ═══ */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Ícone Identificador
              </label>
              <input
                type="text"
                value={deckIcon}
                onChange={(e) => setDeckIcon(e.target.value)}
                className="w-14 p-2 rounded-lg border border-border bg-surface text-foreground text-center text-lg font-bold focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Título do Baralho
              </label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs sm:text-sm focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Descrição
              </label>
              <textarea
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs sm:text-sm focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                URL da Capa
              </label>
              <input
                type="url"
                value={deckCoverUrl}
                onChange={(e) => setDeckCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-foreground text-xs focus:border-primary outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDeck}
                disabled={savingDeck}
                className="flex-1 btn-saas-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingDeck ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Salvar Alterações</span>
              </button>
              <a
                href={`/api/export-apkg?deckId=${deck.id}`}
                download
                className="btn-saas-secondary py-2 px-3 text-xs font-semibold flex items-center gap-1.5 hover:border-emerald-500/40"
                title="Exportar este baralho para pacote Anki (.APKG)"
              >
                <Download size={14} className="text-emerald-500" />
                <span>Exportar .APKG</span>
              </a>
            </div>
          </div>

          {/* ═══ CARDS SECTION ═══ */}
          <div className="mt-5 pt-4 border-t border-border">
            <button
              onClick={loadCards}
              className="w-full btn-saas-secondary flex items-center justify-center gap-2"
            >
              {loadingCards ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <BookOpen size={14} />
              )}
              <span>{showCards ? "Ocultar Cards" : `Gerenciar Cards (${deck.totalCards})`}</span>
              {!loadingCards && (showCards ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>

            <AnimatePresence>
              {showCards && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                    {cards.length === 0 && (
                      <p className="text-center text-muted-foreground text-xs py-4 font-medium">Nenhum card cadastrado.</p>
                    )}
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 rounded-lg border border-border bg-muted/10 text-xs"
                      >
                        {editingCardId === card.id ? (
                          /* ═══ EDITING MODE ═══ */
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-muted-foreground mb-1">Frente</label>
                              <div className="rounded-lg border border-border overflow-hidden focus-within:border-primary">
                                <RichToolbar textareaRef={editFrontRef} value={editFront} onChange={setEditFront} />
                                <textarea
                                  ref={editFrontRef}
                                  value={editFront}
                                  onChange={(e) => setEditFront(e.target.value)}
                                  rows={2}
                                  className="w-full p-2 bg-surface text-foreground text-xs outline-none resize-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-muted-foreground mb-1">Verso</label>
                              <div className="rounded-lg border border-border overflow-hidden focus-within:border-primary">
                                <RichToolbar textareaRef={editBackRef} value={editBack} onChange={setEditBack} />
                                <textarea
                                  ref={editBackRef}
                                  value={editBack}
                                  onChange={(e) => setEditBack(e.target.value)}
                                  rows={2}
                                  className="w-full p-2 bg-surface text-foreground text-xs outline-none resize-none"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={cancelEditCard}
                                className="flex-1 btn-saas-secondary py-1 text-xs"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveCard(card.id)}
                                disabled={savingCard}
                                className="flex-1 btn-saas-primary py-1 text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {savingCard ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ═══ VIEW MODE ═══ */
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {card.front}
                              </p>
                              <p className="text-muted-foreground truncate mt-0.5">
                                {card.back}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => startEditCard(card)}
                                className="btn-saas-secondary p-1 rounded"
                                title="Editar"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deletingCardId === card.id}
                                className="btn-saas-secondary p-1 rounded text-rose-500 disabled:opacity-50"
                                title="Apagar"
                              >
                                {deletingCardId === card.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
