import { getDecks, getUserProfile, seedDemoDeckIfEmpty } from "@/app/actions/flashcards";
import DeckManager from "@/components/DeckManager";

export const revalidate = 0; // Realtime / Dynamic

export default async function HomePage() {
  await seedDemoDeckIfEmpty();
  const decks = await getDecks();
  const userProfile = await getUserProfile();

  return (
    <main className="min-h-screen bg-black text-white antialiased selection:bg-[#0071e3] selection:text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0071e3]/30">
              A
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight">Anki Pro</span>
              <span className="ml-2 text-xs font-semibold text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                Apple Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400">Neon DB Online</span>
          </div>
        </header>

        <DeckManager decks={decks} userProfile={userProfile} />
      </div>
    </main>
  );
}
