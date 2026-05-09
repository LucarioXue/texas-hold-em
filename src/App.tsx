import { GameProvider } from './context/GameContext'
import PlayerSlider from './components/PlayerSlider'
import CardSlots from './components/CardSlots'
import DecisionPanel from './components/DecisionPanel'
import PokerKeyboard from './components/PokerKeyboard'

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-dvh flex flex-col px-4 py-6 max-w-md mx-auto gap-4 select-none">
        {/* Header */}
        <h1 className="text-white/60 text-xs font-medium tracking-[0.3em] uppercase text-center">
          Poker Decision
        </h1>

        {/* Player slider */}
        <PlayerSlider />

        {/* Card slots */}
        <CardSlots />

        {/* Decision panel */}
        <DecisionPanel />

        {/* Spacer to push keyboard to bottom */}
        <div className="flex-1" />

        {/* Poker keyboard */}
        <PokerKeyboard />
      </div>
    </GameProvider>
  )
}
