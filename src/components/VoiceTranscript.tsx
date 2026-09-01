import type { VoiceTranscriptMessage } from '../voice/types'

type VoiceTranscriptProps = {
  messages: VoiceTranscriptMessage[]
}

function VoiceTranscript({ messages }: VoiceTranscriptProps) {
  return (
    <section aria-labelledby="voice-transcript-heading" className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="voice-transcript-heading" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#899188]">Transcript</h2>
        {messages.length > 0 ? <span className="text-xs text-[#687168]">Live</span> : null}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
          <p className="text-sm text-[#899188]">Your conversation will appear here.</p>
        </div>
      ) : (
        <div aria-live="polite" className="space-y-3">
          {messages.map((message) => (
            <article className={`rounded-2xl border px-4 py-3 ${message.role === 'user' ? 'border-white/10 bg-[#181d19]' : 'border-[#c9f27b]/10 bg-[#252d26]'}`} key={message.id}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#899188]">
                {message.role === 'user' ? 'You' : 'Ronnie'}
              </p>
              <p className="text-sm leading-6 text-[#f3f5ef]">{message.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default VoiceTranscript
