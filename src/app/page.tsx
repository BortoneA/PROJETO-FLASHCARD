import { getDecks, getUserProfile, seedDemoDeckIfEmpty } from "@/app/actions/flashcards";
import DeckManager from "@/components/DeckManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import Mascot from "@/components/Mascot";
import { Flame, Gem, Crown } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  await seedDemoDeckIfEmpty();
  const decks = await getDecks();
  const userProfile = await getUserProfile();

  const totalCards = decks.reduce((acc, d) => acc + d.totalCards, 0);
  const streak = userProfile?.streak || 1;
  const xp = userProfile?.xp || 0;
  const level = userProfile?.level || 1;

  return (
    <main className="min-h-screen bg-[#f7f7f7] dark:bg-[#131416] text-foreground antialiased transition-colors duration-200">
      {/* Duolingo Top Navbar */}
      <header className="border-b-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18191c] sticky top-0 z-30 transition-colors shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand Mascot */}
          <div className="flex items-center gap-2.5">
            <Mascot size={38} mood="happy" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-2xl tracking-tight text-[#58cc02] hover:opacity-90 transition-opacity">
                duocards
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/50 hidden xs:inline">
                PRO
              </span>
            </div>
          </div>

          {/* Duolingo Status Tokens (Flame, Gems, Crown) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Token */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 font-black text-xs sm:text-sm select-none"
              title={`${streak} dias de sequ\u00eancia!`}
            >
              <Flame size={16} className="fill-amber-500 text-amber-500 animate-pulse" />
              <span>{streak}</span>
            </div>

            {/* Gems / XP Token */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 font-black text-xs sm:text-sm select-none"
              title={`${xp} cristais de XP`}
            >
              <Gem size={16} className="fill-blue-500 text-blue-500" />
              <span>{xp}</span>
            </div>

            {/* Crown / Level Token */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-300 dark:border-yellow-700/50 text-yellow-600 dark:text-yellow-400 font-black text-xs sm:text-sm select-none"
              title={`N\u00edvel ${level}`}
            >
              <Crown size={16} className="fill-yellow-500 text-yellow-500" />
              <span>{level}</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DeckManager decks={decks} userProfile={userProfile} />
      </div>
    </main>
  );
}
