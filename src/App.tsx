import { useState } from 'react'
import LogPage from './pages/LogPage'
import TodayPage from './pages/TodayPage'
import VoicePage from './pages/VoicePage'

type Screen = 'today' | 'log' | 'voice'

const navigation: { id: Screen; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '⌂' },
  { id: 'voice', label: 'Voice', icon: '◉' },
  { id: 'log', label: 'Log', icon: '≡' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('today')

  return (
    <div className="min-h-screen bg-[#101311] text-[#f3f5ef]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-5 sm:px-8 lg:flex-row lg:gap-16 lg:px-10 lg:pb-10">
        <header className="flex items-center justify-between py-5 lg:w-56 lg:flex-col lg:items-stretch lg:py-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#c9f27b] text-sm font-black text-[#1a2415] shadow-[0_0_24px_rgba(201,242,123,0.12)]">
                R
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide text-[#f3f5ef]">Ronnie OS</p>
                <p className="text-xs text-[#899188]">Daily activity log</p>
              </div>
            </div>
          </div>

          <nav className="fixed inset-x-5 bottom-5 z-10 flex rounded-2xl border border-white/10 bg-[#1a1f1b]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur sm:inset-x-8 lg:static lg:mt-16 lg:flex-col lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            {navigation.map((item) => (
              <button
                key={item.id}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors lg:justify-start ${
                  screen === item.id
                    ? 'bg-[#252d26] text-[#c9f27b]'
                    : 'text-[#899188] hover:bg-white/5 hover:text-[#f3f5ef]'
                }`}
                onClick={() => setScreen(item.id)}
                type="button"
              >
                <span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <p className="hidden text-xs leading-5 text-[#687168] lg:block">
            Record less.
            <br />
            Understand more.
          </p>
        </header>

        <main className="flex-1 pb-28 pt-8 sm:pt-12 lg:pb-10 lg:pt-20">
          {screen === 'today' ? (
            <TodayPage />
          ) : screen === 'voice' ? (
            <VoicePage />
          ) : (
            <LogPage />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
