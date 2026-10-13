"use client";

import { useMemo, useState } from "react";
import { Calendar, Flame, Trophy, Award } from "lucide-react";

interface ActivityHeatmapProps {
  activityData: Record<string, { count: number; goodCount: number }>;
}

export default function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  // Gera os últimos 147 dias (21 semanas exatas)
  const days = useMemo(() => {
    const list: { dateStr: string; dateObj: Date; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ajusta para terminar no dia atual ou fim da semana
    const dayOfWeek = today.getDay(); // 0 = Domingo
    const totalDays = 21 * 7;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = activityData[dateStr]?.count || 0;
      list.push({ dateStr, dateObj: d, count });
    }

    return list;
  }, [activityData]);

  // Estatísticas
  const stats = useMemo(() => {
    let totalReviews = 0;
    let activeDays = 0;
    let maxDayReviews = 0;

    Object.values(activityData).forEach((v) => {
      totalReviews += v.count;
      if (v.count > 0) activeDays++;
      if (v.count > maxDayReviews) maxDayReviews = v.count;
    });

    return { totalReviews, activeDays, maxDayReviews };
  }, [activityData]);

  // Função para definir a cor do tile
  const getTileColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-[#131f24] border-zinc-200 dark:border-[#28353d]";
    if (count <= 4) return "bg-[#58cc02]/35 border-[#58cc02]/50 text-white";
    if (count <= 12) return "bg-[#58cc02]/70 border-[#58cc02]/85 text-white";
    if (count <= 24) return "bg-[#58cc02] border-[#46a302] text-white";
    return "bg-[#46a302] border-[#388502] text-white shadow-sm";
  };

  // Formata data brasileira
  const formatDateBR = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="card-duo bg-white dark:bg-[#182228] p-5 sm:p-6 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border-2 border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-[#58cc02]">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {"Mapa de Calor de Consist\u00e2ncia"}
            </h3>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Histórico de revisões ativas nos últimos 5 meses
            </p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2 text-xs font-black">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#131f24] border border-zinc-200 dark:border-[#28353d] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Flame size={14} className="text-amber-500" />
            <span>{stats.activeDays} dias ativos</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#131f24] border border-zinc-200 dark:border-[#28353d] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Trophy size={14} className="text-[#58cc02]" />
            <span>{stats.maxDayReviews} recorde</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[620px]">
          {/* Grid de 21 colunas x 7 linhas */}
          <div className="grid grid-flow-col grid-rows-7 gap-1.5">
            {days.map((d) => (
              <div
                key={d.dateStr}
                onMouseEnter={() => setHoveredDay({ date: d.dateStr, count: d.count })}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[5px] border cursor-pointer transition-all hover:scale-125 ${getTileColor(
                  d.count
                )}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 pt-1">
        <div>
          {hoveredDay ? (
            <span className="text-[#58cc02] font-black">
              {hoveredDay.count} {hoveredDay.count === 1 ? "revis\u00e3o" : "revis\u00f5es"} em {formatDateBR(hoveredDay.date)}
            </span>
          ) : (
            <span>Passe o mouse sobre os blocos para inspecionar</span>
          )}
        </div>

        {/* Legend escala */}
        <div className="flex items-center gap-1.5">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-[4px] bg-zinc-100 dark:bg-[#131f24] border border-zinc-200 dark:border-[#28353d]" />
          <div className="w-3 h-3 rounded-[4px] bg-[#58cc02]/35 border border-[#58cc02]/50" />
          <div className="w-3 h-3 rounded-[4px] bg-[#58cc02]/70 border border-[#58cc02]/85" />
          <div className="w-3 h-3 rounded-[4px] bg-[#58cc02] border border-[#46a302]" />
          <div className="w-3 h-3 rounded-[4px] bg-[#46a302] border border-[#388502]" />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
