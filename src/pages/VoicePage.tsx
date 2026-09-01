import VoiceSession from '../components/VoiceSession'

function VoicePage() {
  return (
    <section aria-labelledby="voice-heading" className="mx-auto max-w-2xl">
      <div className="mb-10">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#899188]">Realtime companion</p>
        <h1 id="voice-heading" className="text-3xl font-semibold tracking-tight text-[#f3f5ef] sm:text-4xl">Talk with Ronnie</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-[#899188]">
          Have a natural voice conversation. Interrupt, pause, or end it whenever you want.
        </p>
      </div>

      <VoiceSession />
    </section>
  )
}

export default VoicePage
