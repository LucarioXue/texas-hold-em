import { RotateCcw } from 'lucide-react'

const CHIP_VALUES = [5, 10, 20, 50, 100, 500]

interface ChipInputProps {
  label: string
  value: number
  onChange: (v: number) => void
}

export default function ChipInput({ label, value, onChange }: ChipInputProps) {
  const hasValue = value > 0

  return (
    <div className="space-y-1.5">
      {/* Label + reset */}
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-[10px] font-medium tracking-wider uppercase">
          {label}
        </span>
        <button
          onClick={() => onChange(0)}
          className={`flex items-center gap-0.5 text-[10px] transition-all duration-150 active:scale-90
            ${hasValue ? 'text-white/40 hover:text-white/60' : 'text-white/15 pointer-events-none'}`}
          disabled={!hasValue}
        >
          <RotateCcw size={10} strokeWidth={2} />
          <span>归零</span>
        </button>
      </div>

      {/* Chip buttons */}
      <div className="flex gap-1.5">
        {CHIP_VALUES.map(chip => (
          <button
            key={chip}
            onClick={() => onChange(value + chip)}
            className="flex-1 py-2 rounded-lg text-white/80 text-xs font-bold
              bg-white/5 border border-white/10
              hover:bg-white/10 active:scale-95 active:bg-gold/20 active:border-gold/50
              transition-all duration-100 select-none"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Current value */}
      <div className="text-right">
        <span className={`tabular-nums text-xs font-bold transition-colors duration-200
          ${hasValue ? 'text-gold' : 'text-white/15'}`}>
          {hasValue ? value : '—'}
        </span>
      </div>
    </div>
  )
}
