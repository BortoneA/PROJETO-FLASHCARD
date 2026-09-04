import { getDecks, getUserProfile, seedDemoDeckIfEmpty } from "@/app/actions/flashcards";
import DeckManager from "@/components/DeckManager";

export const revalidate = 0;

export default async function HomePage() {
  await seedDemoDeckIfEmpty();
  const decks = await getDecks();
  const userProfile = await getUserProfile();

  return (
    <main className="min-h-screen bg-black text-white antialiased">
      {/* Subtle ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#0071e3]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <header className="flex items-center justify-between border-b border-zinc-800/60 pb-5 mb-6 sm:mb-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#0071e3] to-indigo-500 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-[#0071e3]/30 animate-gradient">
              A
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight">Anki Pro</span>
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-semibold text-zinc-500 bg-zinc-800/80 px-2 sm:px-2.5 py-0.5 rounded-full hidden xs:inline">
                Apple Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-semibold text-zinc-500">Neon DB</span>
          </div>
        </header>

        <DeckManager decks={decks} userProfile={userProfile} />
      </div>
    </main>
  );
}
