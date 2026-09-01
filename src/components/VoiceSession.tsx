import { useRef } from 'react'
import VoiceButton from './VoiceButton'
import VoiceStatus from './VoiceStatus'
import VoiceTranscript from './VoiceTranscript'
import { useVoiceSession } from '../voice/useVoiceSession'

function VoiceSession() {
  const audioElementRef = useRef<HTMLAudioElement>(null)
  const {
    end,
    error,
    isActive,
    isMuted,
    retry,
    start,
    state,
    toggleMute,
    transcript,
  } = useVoiceSession(audioElementRef)

  const canMute = state === 'connected' || state === 'listening' || state === 'speaking' || state === 'muted'
  const isStarting = state === 'requesting-permission' || state === 'connecting'

  return (
    <div>
      <div className="rounded-3xl border border-white/10 bg-[#181d19] px-5 py-10 text-center shadow-2xl shadow-black/10 sm:px-10">
        <VoiceStatus state={state} />

        <div className="mt-8 flex justify-center">
          {isActive ? (
            <div className={`grid size-24 place-items-center rounded-full border sm:size-28 ${state === 'speaking' ? 'border-[#c9f27b]/70 bg-[#c9f27b]/10 text-[#c9f27b]' : 'border-white/10 bg-[#252d26] text-[#c9f27b]'}`}>
              <span aria-hidden="true" className="text-4xl">◉</span>
            </div>
          ) : (
            <VoiceButton disabled={isStarting} label={state === 'error' ? 'Try connecting again' : 'Start voice conversation'} onClick={state === 'error' ? retry : start} />
          )}
        </div>

        {isActive ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              aria-pressed={isMuted}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#dce2d8] transition-colors hover:border-[#c9f27b]/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canMute}
              onClick={toggleMute}
              type="button"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              className="rounded-xl bg-[#f28f8f]/15 px-4 py-3 text-sm font-semibold text-[#ffb0b0] transition-colors hover:bg-[#f28f8f]/25"
              onClick={end}
              type="button"
            >
              End
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-[#f28f8f]/20 bg-[#f28f8f]/10 px-4 py-3 text-left text-sm leading-6 text-[#ffb0b0]" role="alert">
            <p>{error}</p>
            <button className="mt-3 font-semibold underline decoration-[#ffb0b0]/50 underline-offset-4 hover:decoration-[#ffb0b0]" onClick={retry} type="button">Retry connection</button>
          </div>
        ) : null}

        <p className="mx-auto mt-8 max-w-sm text-xs leading-5 text-[#687168]">
          Ronnie listens only while this conversation is active. This Phase 1 shell does not save voice conversations or write to your activity log.
        </p>
      </div>

      <VoiceTranscript messages={transcript} />
      <audio aria-label="Ronnie voice audio" autoPlay className="hidden" ref={audioElementRef} />
    </div>
  )
}

export default VoiceSession
