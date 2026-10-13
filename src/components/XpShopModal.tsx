"use client";

import { useState, useEffect } from "react";
import { purchaseShopItem } from "@/app/actions/flashcards";
import { sound } from "@/lib/sound";
import { triggerConfetti } from "@/lib/confetti";
import { X, Sparkles, Shield, Crown, Zap, Award, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface XpShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXp: number;
  onXpChange?: (newXp: number) => void;
  onCrownUnlocked?: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: any;
  color: string;
  badgeText: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "streak_freeze",
    name: "Congelamento de Sequência",
    description: "Equipa um escudo protetor que salva seu Streak se você esquecer de estudar por 1 dia.",
    cost: 150,
    icon: Shield,
    color: "#1cb0f6",
    badgeText: "Consumível",
  },
  {
    id: "golden_crown",
    name: "Coroa Real da Mascote",
    description: "Desbloqueia uma Coroa Dourada de pedras preciosas reluzentes exclusiva para sua coruja!",
    cost: 300,
    icon: Crown,
    color: "#ffd700",
    badgeText: "Visual Raro",
  },
  {
    id: "double_xp",
    name: "Elixir de XP Dobrado",
    description: "Ativa um multiplicador mágico que dobra o XP recebido nas suas próximas 15 lições.",
    cost: 100,
    icon: Zap,
    color: "#a855f7",
    badgeText: "Buff",
  },
  {
    id: "legendary_title",
    name: "Título: Grão-Mestre da Memória",
    description: "Ostente o título honorário mais cobiçado da academia de flashcards no seu perfil.",
    cost: 200,
    icon: Award,
    color: "#ff9600",
    badgeText: "Conquista",
  },
];

export default function XpShopModal({
  isOpen,
  onClose,
  currentXp,
  onXpChange,
  onCrownUnlocked,
}: XpShopModalProps) {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [boughtItems, setBoughtItems] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBoughtItems({
        golden_crown: localStorage.getItem("duo_golden_crown") === "true",
        streak_freeze: localStorage.getItem("duo_streak_freeze") === "true",
        double_xp: localStorage.getItem("duo_double_xp") === "true",
        legendary_title: localStorage.getItem("duo_legendary_title") === "true",
      });
    }
  }, []);

  if (!isOpen) return null;

  const handleBuy = async (item: ShopItem) => {
    if (currentXp < item.cost) {
      sound.playError();
      setErrorMessage(`Você precisa de mais ${item.cost - currentXp} XP para adquirir este item!`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setBuyingId(item.id);
    try {
      const updatedProfile = await purchaseShopItem(item.cost);
      sound.playLevelUp();
      triggerConfetti();

      // Persiste inventário localmente
      if (item.id === "golden_crown") {
        localStorage.setItem("duo_golden_crown", "true");
        if (onCrownUnlocked) onCrownUnlocked();
      } else {
        localStorage.setItem(`duo_${item.id}`, "true");
      }

      setBoughtItems((prev) => ({ ...prev, [item.id]: true }));
      if (onXpChange) onXpChange(updatedProfile.xp);
    } catch (err: any) {
      sound.playError();
      setErrorMessage(err.message || "Erro na compra");
    } finally {
      setBuyingId(null);
    }
  };

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
          className="card-duo bg-white dark:bg-[#182228] p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-500/15 border-2 border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                  Loja de Recompensas XP
                </h2>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Troque seus cristais conquistados por vantagens épicas
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Saldo de XP Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border-2 border-cyan-200 dark:border-cyan-500/30">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
              Seu Saldo Disponível
            </span>
            <span className="text-base font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              💎 {currentXp} XP
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          {/* Lista de Itens */}
          <div className="space-y-3">
            {SHOP_ITEMS.map((item) => {
              const Icon = item.icon;
              const isBought = boughtItems[item.id];
              const canAfford = currentXp >= item.cost;

              return (
                <div
                  key={item.id}
                  className="card-duo p-4 bg-zinc-50/70 dark:bg-[#131f24] border-zinc-200 dark:border-[#28353d] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}40`,
                        color: item.color,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {item.badgeText}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    {isBought ? (
                      <span className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-[#58cc02] font-black text-xs uppercase flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-500/30">
                        <Check size={14} strokeWidth={3} /> Ativo
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={buyingId === item.id}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          canAfford ? "btn-duo-green" : "btn-duo-white opacity-60 cursor-not-allowed"
                        }`}
                      >
                        {buyingId === item.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <span>Comprar por {item.cost} XP</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full btn-duo-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
          >
            Fechar Loja
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
