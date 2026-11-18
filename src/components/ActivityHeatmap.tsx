"use client";

import { useMemo, useState } from "react";
import { Flame, Trophy } from "lucide-react";

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

  // Função para definir a cor do tile estilo GitHub / Linear
  const getTileColor = (count: number) => {
    if (count === 0) return "bg-muted/20 border-border/60 hover:border-muted-foreground/40";
    if (count <= 4) return "bg-emerald-500/25 border-emerald-500/40 text-white";
    if (count <= 12) return "bg-emerald-500/50 border-emerald-500/60 text-white";
    if (count <= 24) return "bg-emerald-500/80 border-emerald-500/90 text-white";
    return "bg-emerald-500 border-emerald-400 text-white shadow-xs";
  };

  // Formata data brasileira
  const formatDateBR = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-3.5 pt-1">
      {/* Top Header stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-muted-foreground font-mono">
          <span>{stats.totalReviews} revisões registradas no período</span>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2 font-mono">
          <div className="px-2.5 py-1 rounded-md bg-muted/15 border border-border text-foreground flex items-center gap-1.5">
            <Flame size={12} className="text-amber-500" />
            <span>{stats.activeDays} dias ativos</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-muted/15 border border-border text-foreground flex items-center gap-1.5">
            <Trophy size={12} className="text-emerald-500" />
            <span>Recorde: {stats.maxDayReviews}/dia</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[620px]">
          {/* Grid de 21 colunas x 7 linhas */}
          <div className="grid grid-flow-col grid-rows-7 gap-1 sm:gap-1.5">
            {days.map((d) => (
              <div
                key={d.dateStr}
                onMouseEnter={() => setHoveredDay({ date: d.dateStr, count: d.count })}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3.5px] border cursor-pointer transition-all hover:scale-125 ${getTileColor(
                  d.count
                )}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <div>
          {hoveredDay ? (
            <span className="text-foreground font-semibold font-mono">
              {hoveredDay.count} {hoveredDay.count === 1 ? "revisão" : "revisões"} em {formatDateBR(hoveredDay.date)}
            </span>
          ) : (
            <span>Passe o mouse sobre os blocos para inspecionar</span>
          )}
        </div>

        {/* Legend escala */}
        <div className="flex items-center gap-1.5">
          <span>Menos</span>
          <div className="w-2.5 h-2.5 rounded-[2.5px] bg-muted/20 border border-border/60" />
          <div className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-500/25 border border-emerald-500/40" />
          <div className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-500/50 border border-emerald-500/60" />
          <div className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-500/80 border border-emerald-500/90" />
          <div className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-500 border border-emerald-400" />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
