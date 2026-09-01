import { createRealtimeSession, VoiceProviderError } from '../../server/voice/createSession.mjs'

const MAX_SDP_BYTES = 2 * 1024 * 1024
const ALLOWED_ORIGIN = process.env.VOICE_ALLOWED_ORIGIN

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request) {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/sdp') {
    return jsonResponse(415, { error: 'Expected an application/sdp request.' })
  }

  if (ALLOWED_ORIGIN) {
    const origin = request.headers.get('origin')
    if (origin && origin !== ALLOWED_ORIGIN) {
      return jsonResponse(403, { error: 'This voice endpoint is not available from this origin.' })
    }
  }

  const sdp = await request.text()
  if (!sdp.trim()) {
    return jsonResponse(400, { error: 'The session offer is empty.' })
  }

  if (Buffer.byteLength(sdp, 'utf8') > MAX_SDP_BYTES) {
    return jsonResponse(413, { error: 'The session offer is too large.' })
  }

  try {
    const answer = await createRealtimeSession({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.VOICE_MODEL || undefined,
      sdp,
    })

    return new Response(answer, {
      status: 200,
      headers: {
        'Content-Type': 'application/sdp',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof VoiceProviderError) {
      return jsonResponse(error.status, { error: error.message })
    }

    console.error('Unexpected voice server error:', error)
    return jsonResponse(500, { error: 'Unable to create a voice session.' })
  }
}
