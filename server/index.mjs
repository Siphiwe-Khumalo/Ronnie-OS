import { createServer } from 'node:http'
import { createRealtimeSession, VoiceProviderError } from './voice/createSession.mjs'

const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '127.0.0.1'
const ALLOWED_ORIGIN = process.env.VOICE_ALLOWED_ORIGIN
const MAX_CONCURRENT_SESSIONS = 2
const MAX_SDP_BYTES = 2 * 1024 * 1024
let activeSessionCount = 0

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(body)
}

function sendText(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  })
  response.end(body)
}

async function readSdpBody(request) {
  const declaredLength = Number(request.headers['content-length'])
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SDP_BYTES) {
    throw new VoiceProviderError('The session offer is too large.', 413)
  }

  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_SDP_BYTES) {
      throw new VoiceProviderError('The session offer is too large.', 413)
    }
    chunks.push(chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

async function handleVoiceSession(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  const contentType = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/sdp') {
    sendJson(response, 415, { error: 'Expected an application/sdp request.' })
    return
  }

  if (ALLOWED_ORIGIN && request.headers.origin !== ALLOWED_ORIGIN) {
    sendJson(response, 403, { error: 'This voice endpoint is not available from this origin.' })
    return
  }

  if (activeSessionCount >= MAX_CONCURRENT_SESSIONS) {
    sendJson(response, 429, { error: 'The voice service is busy. Please try again shortly.' })
    return
  }

  const sdp = await readSdpBody(request)
  if (!sdp.trim()) {
    sendJson(response, 400, { error: 'The session offer is empty.' })
    return
  }

  activeSessionCount += 1
  try {
    const answer = await createRealtimeSession({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.VOICE_MODEL || undefined,
      sdp,
    })

    sendText(response, 200, answer, 'application/sdp')
  } finally {
    activeSessionCount -= 1
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === '/health') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.url === '/api/voice/session') {
      await handleVoiceSession(request, response)
      return
    }

    sendJson(response, 404, { error: 'Not found.' })
  } catch (error) {
    if (error instanceof VoiceProviderError) {
      sendJson(response, error.status, { error: error.message })
      return
    }

    console.error('Unexpected voice server error:', error)
    sendJson(response, 500, { error: 'Unable to create a voice session.' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Ronnie voice server listening on http://${HOST}:${PORT}`)
})
