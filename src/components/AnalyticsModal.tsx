"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getRetentionAnalytics } from "@/app/actions/flashcards";
import { BarChart3, X, Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AnalyticsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<{ totalReviews: number; ratingsCount: Record<number, number> } | null>(null);

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
    labels: ["Again (Erros)", `Hard (Dif\u00edcil)`, "Good (Bom)", `Easy (F\u00e1cil)`],
    datasets: [
      {
        data: [again, hard, good, easy],
        backgroundColor: ["#f43f5e", "#f59e0b", "#10b981", "#0071e3"],
        borderColor: "#18181b",
        borderWidth: 3,
        borderRadius: 4,
      },
    ],
  };

  const retentionRate = total > 0 ? Math.round(((good + easy) / total) * 100) : 100;
  const errorRate = total > 0 ? Math.round(((again) / total) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl space-y-4 sm:space-y-5 max-h-[85vh] overflow-y-auto safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[#0071e3]" /> {`Desempenho e Reten\u00e7\u00e3o`}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-700/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-zinc-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold">{`Total de Revis\u00f5es`}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{total}</div>
              </div>
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-700/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold">{`Taxa de Reten\u00e7\u00e3o`}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">{retentionRate}%</div>
              </div>
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-700/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={12} className="text-[#0071e3]" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold">Acertos</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0071e3] tabular-nums">{good + easy}</div>
              </div>
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-700/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle size={12} className="text-rose-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold">Taxa de Erro</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-400 tabular-nums">{errorRate}%</div>
              </div>
            </div>

            {/* Chart */}
            {total > 0 ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto">
                <Doughnut
                  data={doughnutData}
                  options={{
                    cutout: "65%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: "#71717a",
                          font: { size: 11 },
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
              <div className="text-center py-8 sm:py-10">
                <div className="w-12 h-12 bg-zinc-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
                  {"\uD83D\uDCCA"}
                </div>
                <p className="text-xs sm:text-sm text-zinc-500">
                  {`Realize algumas revis\u00f5es para visualizar o gr\u00e1fico de h\u00e1bitos e mem\u00f3ria!`}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
