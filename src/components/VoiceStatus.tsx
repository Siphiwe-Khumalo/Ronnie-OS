import type { VoiceSessionState } from '../voice/types'

type VoiceStatusProps = {
  state: VoiceSessionState
}

const statusCopy: Record<VoiceSessionState, string> = {
  idle: 'Tap the microphone to talk with Ronnie',
  'requesting-permission': 'Allow microphone access to begin',
  connecting: 'Connecting securely to Ronnie',
  connected: 'Ready when you are',
  listening: 'Listening',
  speaking: 'Ronnie is speaking',
  muted: 'Microphone muted',
  ending: 'Ending conversation',
  error: 'Connection needs attention',
}

function VoiceStatus({ state }: VoiceStatusProps) {
  const isLive = state === 'connected' || state === 'listening' || state === 'speaking'

  return (
    <div aria-live="polite" className="flex items-center justify-center gap-2 text-sm text-[#899188]">
      <span className={`size-2 rounded-full ${isLive ? 'bg-[#c9f27b] shadow-[0_0_12px_rgba(201,242,123,0.7)]' : state === 'error' ? 'bg-[#ffb0b0]' : 'bg-[#687168]'}`} />
      {statusCopy[state]}
    </div>
  )
}

export default VoiceStatus
