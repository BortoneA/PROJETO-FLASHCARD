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
      setCards(cards.map(c => c.id === cardId ? { ...c, front: editFront, back: editBack, extra: editExtra, imageUrl: editImageUrl } : c));
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
      setCards(cards.filter(c => c.id !== cardId));
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto safe-bottom transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden transition-colors" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 transition-colors">
              <Settings size={18} className="text-[#0071e3]" />
              Editar Baralho
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition touch-manipulation">
              <X size={18} className="text-zinc-500" />
            </button>
          </div>

          {/* ═══ DECK FIELDS ═══ */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{"\u00cdcone Emoji"}</label>
              <input
                type="text"
                value={deckIcon}
                onChange={(e) => setDeckIcon(e.target.value)}
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-lg text-center font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{`T\u00edtulo`}</label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">{`Descri\u00e7\u00e3o`}</label>
              <textarea
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none resize-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-zinc-500 mb-1">URL da Capa</label>
              <input
                type="url"
                value={deckCoverUrl}
                onChange={(e) => setDeckCoverUrl(e.target.value)}
                placeholder="https://exemplo.com/capa.jpg"
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0071e3] outline-none min-h-[48px] text-xs transition-colors"
              />
            </div>

            <button
              onClick={handleSaveDeck}
              disabled={savingDeck}
              className="w-full py-3 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#005bb5] transition min-h-[48px] touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingDeck ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar Baralho
            </button>
          </div>

          {/* ═══ CARDS SECTION ═══ */}
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
            <button
              onClick={loadCards}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition min-h-[48px] touch-manipulation flex items-center justify-center gap-2"
            >
              {loadingCards ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <BookOpen size={16} />
              )}
              {showCards ? "Ocultar Cards" : `Ver e Editar Cards (${deck.totalCards})`}
              {!loadingCards && (showCards ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
            </button>

            <AnimatePresence>
              {showCards && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {cards.length === 0 && (
                      <p className="text-center text-zinc-400 text-sm py-4">Nenhum card neste baralho.</p>
                    )}
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-800/30 transition-colors"
                      >
                        {editingCardId === card.id ? (
                          /* ═══ EDITING MODE ═══ */
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Frente</label>
                              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-[#0071e3]">
                                <RichToolbar textareaRef={editFrontRef} value={editFront} onChange={setEditFront} />
                                <textarea
                                  ref={editFrontRef}
                                  value={editFront}
                                  onChange={(e) => setEditFront(e.target.value)}
                                  rows={2}
                                  className="w-full p-2 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-sm font-medium outline-none resize-none border-0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Verso</label>
                              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-[#0071e3]">
                                <RichToolbar textareaRef={editBackRef} value={editBack} onChange={setEditBack} />
                                <textarea
                                  ref={editBackRef}
                                  value={editBack}
                                  onChange={(e) => setEditBack(e.target.value)}
                                  rows={3}
                                  className="w-full p-2 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-sm font-medium outline-none resize-none border-0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Extra</label>
                              <input
                                value={editExtra}
                                onChange={(e) => setEditExtra(e.target.value)}
                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">URL da Imagem</label>
                              <input
                                value={editImageUrl}
                                onChange={(e) => setEditImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-xs outline-none"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={cancelEditCard}
                                className="flex-1 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg text-xs transition touch-manipulation"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveCard(card.id)}
                                disabled={savingCard}
                                className="flex-1 py-2 bg-[#0071e3] text-white font-bold rounded-lg text-xs transition touch-manipulation flex items-center justify-center gap-1 disabled:opacity-50"
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
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{card.front}</p>
                              <p className="text-xs text-zinc-500 truncate mt-0.5">{card.back}</p>
                              {card.extra && (
                                <p className="text-[10px] text-zinc-400 truncate mt-0.5 italic">{card.extra}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEditCard(card)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition touch-manipulation"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deletingCardId === card.id}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition touch-manipulation disabled:opacity-50"
                                title="Apagar"
                              >
                                {deletingCardId === card.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
      </motion.div>
    </AnimatePresence>
  );
}
