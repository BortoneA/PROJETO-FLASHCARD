"use client";

import { useState, useRef } from "react";
import { updateDeck, updateCard, deleteCard, getCardsForDeck } from "@/app/actions/flashcards";
import {
  X, Pencil, Trash2, Save, ChevronDown, ChevronUp,
  Settings, BookOpen, Loader2
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="card-duo bg-white dark:bg-[#182228] p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Settings size={20} className="text-[#58cc02]" />
              Editar Baralho
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* ═══ DECK FIELDS ═══ */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                {"\u00cdcone (Emoji)"}
              </label>
              <input
                type="text"
                value={deckIcon}
                onChange={(e) => setDeckIcon(e.target.value)}
                className="w-16 p-2.5 rounded-2xl border-2 border-zinc-200 dark:border-[#28353d] bg-zinc-50 dark:bg-[#131f24] text-zinc-900 dark:text-zinc-100 text-center text-xl font-bold focus:border-[#58cc02] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                {"T\u00edtulo"}
              </label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-[#28353d] bg-white dark:bg-[#131f24] text-zinc-900 dark:text-zinc-100 text-sm font-bold focus:border-[#58cc02] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                {"Descri\u00e7\u00e3o"}
              </label>
              <textarea
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-[#28353d] bg-white dark:bg-[#131f24] text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:border-[#58cc02] outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                URL da Capa
              </label>
              <input
                type="url"
                value={deckCoverUrl}
                onChange={(e) => setDeckCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-3 rounded-2xl border-2 border-zinc-200 dark:border-[#28353d] bg-white dark:bg-[#131f24] text-zinc-900 dark:text-zinc-100 text-xs font-semibold focus:border-[#58cc02] outline-none"
              />
            </div>

            <button
              onClick={handleSaveDeck}
              disabled={savingDeck}
              className="w-full btn-duo-green py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingDeck ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
              {"Salvar Altera\u00e7\u00f5es"}
            </button>
          </div>

          {/* ═══ CARDS SECTION ═══ */}
          <div className="mt-6 pt-5 border-t-2 border-zinc-200 dark:border-[#28353d]">
            <button
              onClick={loadCards}
              className="w-full btn-duo-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loadingCards ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <BookOpen size={16} strokeWidth={2.5} />
              )}
              <span>{showCards ? "Ocultar Cards" : `Ver e Editar Cards (${deck.totalCards})`}</span>
              {!loadingCards && (showCards ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />)}
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
                  <div className="mt-3 space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                    {cards.length === 0 && (
                      <p className="text-center text-zinc-400 text-xs py-4 font-bold">Nenhum card neste baralho.</p>
                    )}
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="card-duo p-3 bg-zinc-50/70 dark:bg-[#131f24] border-zinc-200 dark:border-[#28353d] transition-colors"
                      >
                        {editingCardId === card.id ? (
                          /* ═══ EDITING MODE ═══ */
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Frente</label>
                              <div className="rounded-xl border-2 border-zinc-200 dark:border-[#28353d] overflow-hidden focus-within:border-[#58cc02]">
                                <RichToolbar textareaRef={editFrontRef} value={editFront} onChange={setEditFront} />
                                <textarea
                                  ref={editFrontRef}
                                  value={editFront}
                                  onChange={(e) => setEditFront(e.target.value)}
                                  rows={2}
                                  className="w-full p-2 bg-white dark:bg-[#182228] text-zinc-900 dark:text-zinc-100 text-xs font-semibold outline-none resize-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Verso</label>
                              <div className="rounded-xl border-2 border-zinc-200 dark:border-[#28353d] overflow-hidden focus-within:border-[#58cc02]">
                                <RichToolbar textareaRef={editBackRef} value={editBack} onChange={setEditBack} />
                                <textarea
                                  ref={editBackRef}
                                  value={editBack}
                                  onChange={(e) => setEditBack(e.target.value)}
                                  rows={3}
                                  className="w-full p-2 bg-white dark:bg-[#182228] text-zinc-900 dark:text-zinc-100 text-xs font-semibold outline-none resize-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Extra</label>
                              <input
                                value={editExtra}
                                onChange={(e) => setEditExtra(e.target.value)}
                                className="w-full p-2 rounded-xl border-2 border-zinc-200 dark:border-[#28353d] bg-white dark:bg-[#182228] text-zinc-900 dark:text-zinc-100 text-xs font-semibold outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">URL da Imagem</label>
                              <input
                                value={editImageUrl}
                                onChange={(e) => setEditImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full p-2 rounded-xl border-2 border-zinc-200 dark:border-[#28353d] bg-white dark:bg-[#182228] text-zinc-900 dark:text-zinc-100 text-xs font-semibold outline-none"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={cancelEditCard}
                                className="flex-1 btn-duo-white py-1.5 rounded-xl font-black text-xs uppercase"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveCard(card.id)}
                                disabled={savingCard}
                                className="flex-1 btn-duo-green py-1.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1 disabled:opacity-50"
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
                              <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {card.front}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                {card.back}
                              </p>
                              {card.extra && (
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 italic">
                                  {card.extra}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => startEditCard(card)}
                                className="btn-duo-white p-1.5 rounded-xl"
                                title="Editar"
                              >
                                <Pencil size={13} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deletingCardId === card.id}
                                className="btn-duo-white p-1.5 rounded-xl text-rose-500 disabled:opacity-50"
                                title="Apagar"
                              >
                                {deletingCardId === card.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Trash2 size={13} strokeWidth={2.5} />
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
