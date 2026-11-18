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
    name: "Escudo de Sequência",
    description: "Preserva automaticamente seu streak se você não puder revisar por 24 horas.",
    cost: 150,
    icon: Shield,
    color: "#0284c7",
    badgeText: "Utilidade",
  },
  {
    id: "golden_crown",
    name: "Distintivo Prestige de Ouro",
    description: "Selo de distinção visual dourado para o seu perfil e cabeçalho da plataforma.",
    cost: 300,
    icon: Crown,
    color: "#f59e0b",
    badgeText: "Prestígio",
  },
  {
    id: "double_xp",
    name: "Multiplicador de Eficiência",
    description: "Dobra os pontos de XP acumulados nas próximas 15 lições de estudo ativas.",
    cost: 100,
    icon: Zap,
    color: "#8b5cf6",
    badgeText: "Multiplicador",
  },
  {
    id: "legendary_title",
    name: "Patente: Mestre em Retenção",
    description: "Certificação de maestria avançada exibida no perfil de estudos do sistema.",
    cost: 200,
    icon: Award,
    color: "#10b981",
    badgeText: "Patente",
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
      setErrorMessage(`Saldo insuficiente: faltam ${item.cost - currentXp} XP para desbloquear.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setBuyingId(item.id);
    try {
      const updatedProfile = await purchaseShopItem(item.cost);
      sound.playLevelUp();
      triggerConfetti({ count: 50 });

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
      setErrorMessage(err.message || "Erro na transação");
    } finally {
      setBuyingId(null);
    }
  };

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
          className="card-saas p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-purple-500" />
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Centro de Vantagens & Maestria
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* Saldo de XP Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/15 border border-border">
            <span className="text-xs font-semibold text-muted-foreground">
              Saldo Disponível
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {currentXp} XP
            </span>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
              {errorMessage}
            </div>
          )}

          {/* Lista de Itens */}
          <div className="space-y-2.5">
            {SHOP_ITEMS.map((item) => {
              const Icon = item.icon;
              const isBought = boughtItems[item.id];
              const canAfford = currentXp >= item.cost;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-border bg-surface hover:border-border-hover transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}35`,
                        color: item.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground">
                          {item.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    {isBought ? (
                      <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1 border border-emerald-500/20">
                        <Check size={13} /> Ativo
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={buyingId === item.id}
                        className={`btn-saas-secondary py-1 px-3 text-xs font-semibold flex items-center gap-1.5 ${
                          !canAfford ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {buyingId === item.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <span>{item.cost} XP</span>
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
            className="w-full btn-saas-secondary py-2 text-xs font-semibold"
          >
            Fechar
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
