"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { getRetentionAnalytics } from "@/app/actions/flashcards";
import { BarChart3, PieChart, Activity, Award } from "lucide-react";

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
    labels: ["Again (Erros)", "Hard (Dif?cil)", "Good (Bom)", "Easy (F?cil)"],
    datasets: [
      {
        data: [again, hard, good, easy],
        backgroundColor: ["#f43f5e", "#f59e0b", "#10b981", "#0071e3"],
        borderColor: "#18181b",
        borderWidth: 2,
      },
    ],
  };

  const retentionRate = total > 0 ? Math.round(((good + easy) / total) * 100) : 100;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-[#0071e3]" /> Desempenho e Reten??o
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm">
            Fechar ?
          </button>
        </div>

        {/* M?trica Principal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-800/60 p-4 rounded-2xl border border-zinc-700/50">
            <span className="text-xs text-zinc-400 font-semibold">Total de Revis?es</span>
            <div className="text-2xl font-black text-white mt-1">{total}</div>
          </div>
          <div className="bg-zinc-800/60 p-4 rounded-2xl border border-zinc-700/50">
            <span className="text-xs text-zinc-400 font-semibold">Taxa de Reten??o</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{retentionRate}%</div>
          </div>
        </div>

        {/* Gr?fico */}
        {total > 0 ? (
          <div className="w-64 h-64 mx-auto">
            <Doughnut
              data={doughnutData}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: "#a1a1aa", font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-center text-xs text-zinc-400 py-8">
            Realize algumas revis?es para visualizar o gr?fico de h?bitos e mem?ria!
          </p>
        )}
      </div>
    </div>
  );
}
