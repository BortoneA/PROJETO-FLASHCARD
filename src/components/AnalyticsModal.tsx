"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getRetentionAnalytics } from "@/app/actions/flashcards";
import { BarChart3, X, Target, TrendingUp, CheckCircle2, XCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { exportRetentionCSV } from "@/lib/exportRetentionCSV";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AnalyticsModal({
  isOpen,
  onClose,
  decks = [],
  userProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  decks?: any[];
  userProfile?: any;
}) {
  const [data, setData] = useState<{ totalReviews: number; ratingsCount: Record<number, number> } | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      getRetentionAnalytics().then(setData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const total = data?.totalReviews || 0;
  const again = data?.ratingsCount[1] || 0;
  const hard = data?.ratingsCount[2] || 0;
  const good = data?.ratingsCount[3] || 0;
  const easy = data?.ratingsCount[4] || 0;

  const doughnutData = {
    labels: ["Erros", "Difícil", "Bom", "Fácil"],
    datasets: [
      {
        data: [again, hard, good, easy],
        backgroundColor: ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6"],
        borderColor: theme === "dark" ? "#12141a" : "#ffffff",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const retentionRate = total > 0 ? Math.round(((good + easy) / total) * 100) : 100;
  const errorRate = total > 0 ? Math.round(((again) / total) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="card-saas p-6 w-full max-w-md shadow-xl space-y-4 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Métricas de Retenção & SRS
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center gap-1.5 mb-1 text-muted-foreground text-xs">
                  <Target size={13} className="text-blue-500" />
                  <span>Total de Revisões</span>
                </div>
                <div className="text-xl font-bold font-mono text-foreground">{total}</div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <TrendingUp size={13} />
                  <span>Taxa de Retenção</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{retentionRate}%</div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center gap-1.5 mb-1 text-muted-foreground text-xs">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>Respostas Corretas</span>
                </div>
                <div className="text-xl font-bold font-mono text-foreground">{good + easy}</div>
              </div>

              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10">
                <div className="flex items-center gap-1.5 mb-1 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  <XCircle size={13} />
                  <span>Taxa de Esquecimento</span>
                </div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{errorRate}%</div>
              </div>
            </div>

            {/* Doughnut Chart */}
            {total > 0 ? (
              <div className="w-48 h-48 sm:w-52 sm:h-52 mx-auto pt-2">
                <Doughnut
                  data={doughnutData}
                  options={{
                    cutout: "70%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: theme === "dark" ? "#94a3b8" : "#64748b",
                          font: { size: 11, family: "Plus Jakarta Sans" },
                          padding: 10,
                          usePointStyle: true,
                          pointStyleWidth: 8,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">
                  Pratique algumas lições para calcular sua curva de retenção de memória.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => exportRetentionCSV({ analytics: data, decks, userProfile })}
                className="flex-1 btn-saas-secondary py-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-emerald-500/40"
                title="Exportar planilha CSV com métricas e retenção detalhada"
              >
                <Download size={14} className="text-emerald-500" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-saas-primary py-2 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
