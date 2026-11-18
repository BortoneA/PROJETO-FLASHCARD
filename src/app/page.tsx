import {
  getDecks,
  getUserProfile,
  seedDemoDeckIfEmpty,
  getActivityHeatmap,
  getDailyGoalProgress,
} from "@/app/actions/flashcards";
import DeckManager from "@/components/DeckManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundToggle } from "@/components/SoundToggle";
import { Flame, Layers, Award, ShieldCheck, Database } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  await seedDemoDeckIfEmpty();
  const decks = await getDecks();
  const userProfile = await getUserProfile();
  const activityData = await getActivityHeatmap();
  const { todayReviews } = await getDailyGoalProgress();

  const totalCards = decks.reduce((acc, d) => acc + d.totalCards, 0);
  const streak = userProfile?.streak || 1;
  const xp = userProfile?.xp || 0;
  const level = userProfile?.level || 1;

  return (
    <main className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
      {/* ═══════════ TOP EXECUTIVE SAAS NAVBAR ═══════════ */}
      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand Mark & Workspace Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-foreground">
                Kortex
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground bg-muted/15 dark:bg-muted/10 border border-border px-1.5 py-0.5 rounded-md hidden xs:inline">
                Spaced Repetition
              </span>
            </div>
          </div>

          {/* Center Database Status (Linear / Vercel style) */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/10 dark:bg-muted/5 border border-border/60 px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px]">Sincronizado • Neon PostgreSQL</span>
          </div>

          {/* Right Status Indicators & Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold text-xs select-none"
              title={`${streak} dias consecutivos de consistência`}
            >
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span className="font-mono">{streak}d</span>
            </div>

            {/* Mastery & XP Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary dark:text-blue-400 font-semibold text-xs select-none"
              title={`${xp} pontos de experiência • Nível ${level}`}
            >
              <Award size={14} className="text-blue-500" />
              <span className="font-mono">{xp} XP</span>
              <span className="text-muted-foreground text-[10px]">• Lvl {level}</span>
            </div>

            <div className="h-4 w-px bg-border mx-0.5 hidden xs:block" />

            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DeckManager
          decks={decks}
          userProfile={userProfile}
          activityData={activityData}
          todayReviews={todayReviews}
        />
      </div>
    </main>
  );
}
