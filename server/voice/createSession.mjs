const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'
const DEFAULT_MODEL = 'gpt-realtime-mini'
const DEFAULT_VOICE = 'marin'

export class VoiceProviderError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.name = 'VoiceProviderError'
    this.status = status
  }
}

function createSessionConfig(model) {
  return {
    type: 'realtime',
    model,
    instructions: [
      'You are Ronnie, a calm and thoughtful personal voice companion.',
      'Have a natural conversation and answer the user directly.',
      'Keep responses concise unless the user asks for more detail.',
      'Do not claim to access apps, files, personal data, the web, or external tools.',
      'This prototype has no tools and does not save activities or conversation memory.',
    ].join(' '),
    audio: {
      input: {
        noise_reduction: { type: 'near_field' },
        transcription: { model: 'gpt-4o-mini-transcribe' },
        turn_detection: {
          type: 'semantic_vad',
          eagerness: 'low',
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: DEFAULT_VOICE,
      },
    },
  }
}

export async function createRealtimeSession({ apiKey, model = DEFAULT_MODEL, sdp }) {
  if (!apiKey) {
    throw new VoiceProviderError('Voice service is not configured on the server.', 503)
  }

  const form = new FormData()
  form.set('sdp', sdp)
  form.set('session', JSON.stringify(createSessionConfig(model)))

  let response
  try {
    response = await fetch(REALTIME_CALLS_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/sdp',
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    })
  } catch {
    throw new VoiceProviderError('Unable to reach the voice provider.')
  }

  const responseBody = await response.text()

  if (!response.ok) {
    console.error(`OpenAI realtime session failed (${response.status}): ${responseBody.slice(0, 500)}`)
    throw new VoiceProviderError('The voice provider rejected the session request.')
  }

  return responseBody
}
