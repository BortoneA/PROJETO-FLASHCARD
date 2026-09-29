"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getRetentionAnalytics } from "@/app/actions/flashcards";
import { BarChart3, X, Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import Mascot from "./Mascot";

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
        backgroundColor: ["#ff4b4b", "#ff9600", "#58cc02", "#1cb0f6"],
        borderColor: theme === "dark" ? "#18191c" : "#ffffff",
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
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="card-duo bg-white dark:bg-[#18191c] p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mascot size={34} mood="cheering" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                  {"Minhas Conquistas"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-duo bg-zinc-50 dark:bg-zinc-800/50 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-black uppercase tracking-wider">
                    {"Revis\u00f5es"}
                  </span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{total}</div>
              </div>

              <div className="card-duo bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-[#58cc02]" />
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider">
                    {"Reten\u00e7\u00e3o"}
                  </span>
                </div>
                <div className="text-2xl font-black text-[#58cc02] tabular-nums">{retentionRate}%</div>
              </div>

              <div className="card-duo bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/60 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-[#1cb0f6]" />
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-wider">
                    Acertos
                  </span>
                </div>
                <div className="text-2xl font-black text-[#1cb0f6] tabular-nums">{good + easy}</div>
              </div>

              <div className="card-duo bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/60 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle size={14} className="text-[#ff4b4b]" />
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 font-black uppercase tracking-wider">
                    Erros
                  </span>
                </div>
                <div className="text-2xl font-black text-[#ff4b4b] tabular-nums">{errorRate}%</div>
              </div>
            </div>

            {/* Doughnut Chart */}
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
                          color: theme === "dark" ? "#d4d4d8" : "#3f3f46",
                          font: { size: 11, family: "Plus Jakarta Sans", weight: "bold" },
                          padding: 12,
                          usePointStyle: true,
                          pointStyleWidth: 10,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs font-bold text-zinc-500">
                  {"Pratique algumas li\u00e7\u00f5es para ver suas estat\u00edsticas de mem\u00f3ria!"}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full btn-duo-green py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
