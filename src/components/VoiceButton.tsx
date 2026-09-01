type VoiceButtonProps = {
  disabled?: boolean
  label: string
  onClick: () => void
  tone?: 'primary' | 'secondary'
}

function VoiceButton({ disabled = false, label, onClick, tone = 'primary' }: VoiceButtonProps) {
  const className = tone === 'primary'
    ? 'grid size-24 place-items-center rounded-full bg-[#c9f27b] text-4xl text-[#1a2415] shadow-[0_0_48px_rgba(201,242,123,0.18)] transition-transform hover:scale-105 hover:bg-[#d5f896] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:size-28'
    : 'grid size-12 place-items-center rounded-full border border-white/10 bg-[#252d26] text-xl text-[#f3f5ef] transition-colors hover:border-[#c9f27b]/50 hover:text-[#c9f27b] disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <button
      aria-label={label}
      className={className}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">◉</span>
    </button>
  )
}

export default VoiceButton
