import { getDecks, getUserProfile, seedDemoDeckIfEmpty } from "@/app/actions/flashcards";
import DeckManager from "@/components/DeckManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Layers, Sparkles } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  await seedDemoDeckIfEmpty();
  const decks = await getDecks();
  const userProfile = await getUserProfile();

  const totalCards = decks.reduce((acc, d) => acc + d.totalCards, 0);

  return (
    <main className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
      {/* Top subtle border rule */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-surface/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold shadow-sm">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                  Recall
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 hidden sm:inline">
                  {"Repeti\u00e7\u00e3o Espa\u00e7ada"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{decks.length} {"baralhos"}</span>
              <span className="text-zinc-300 dark:text-zinc-600">{"\u2022"}</span>
              <span>{totalCards} cards</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DeckManager decks={decks} userProfile={userProfile} />
      </div>
    </main>
  );
}
