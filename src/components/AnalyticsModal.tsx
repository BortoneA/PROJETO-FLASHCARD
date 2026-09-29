"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getRetentionAnalytics } from "@/app/actions/flashcards";
import { BarChart3, X, Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AnalyticsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
    labels: ["Erros (Novamente)", "Dif\u00edcil", "Bom", "F\u00e1cil"],
    datasets: [
      {
        data: [again, hard, good, easy],
        backgroundColor: ["#f43f5e", "#f59e0b", "#10b981", "#2563eb"],
        borderColor: theme === "dark" ? "#18181b" : "#ffffff",
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5 max-h-[85vh] overflow-y-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <span>{"Desempenho e Reten\u00e7\u00e3o"}</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-zinc-500" />
                  <span className="text-[11px] text-zinc-500 font-semibold">{"Total de Revis\u00f5es"}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{total}</div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] text-zinc-500 font-semibold">{"Taxa de Reten\u00e7\u00e3o"}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{retentionRate}%</div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={12} className="text-blue-600" />
                  <span className="text-[11px] text-zinc-500 font-semibold">Acertos</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{good + easy}</div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle size={12} className="text-rose-500" />
                  <span className="text-[11px] text-zinc-500 font-semibold">Erros</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400 tabular-nums">{errorRate}%</div>
              </div>
            </div>

            {/* Chart */}
            {total > 0 ? (
              <div className="w-48 h-48 sm:w-52 sm:h-52 mx-auto pt-2">
                <Doughnut
                  data={doughnutData}
                  options={{
                    cutout: "68%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: theme === "dark" ? "#a1a1aa" : "#71717a",
                          font: { size: 11, family: "Plus Jakarta Sans" },
                          padding: 12,
                          usePointStyle: true,
                          pointStyleWidth: 8,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-zinc-500">
                  {"Realize algumas revis\u00f5es para visualizar o gr\u00e1fico de reten\u00e7\u00e3o e mem\u00f3ria."}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
