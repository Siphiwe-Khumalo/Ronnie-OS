import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceClient } from './voiceClient'
import type {
  VoiceServerEvent,
  VoiceSessionState,
  VoiceTranscriptMessage,
  VoiceTranscriptRole,
} from './types'

type AudioElementRef = { current: HTMLAudioElement | null }

function getString(event: VoiceServerEvent, key: string): string | undefined {
  const value = event[key]
  return typeof value === 'string' ? value : undefined
}

function getEventError(event: VoiceServerEvent): string {
  const error = event.error
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Ronnie reported a realtime conversation error.'
}

function upsertTranscript(
  messages: VoiceTranscriptMessage[],
  id: string,
  role: VoiceTranscriptRole,
  text: string,
  isFinal: boolean,
): VoiceTranscriptMessage[] {
  const existingIndex = messages.findIndex((message) => message.id === id)
  if (existingIndex === -1) {
    return [...messages, { id, role, text, isFinal }]
  }

  const next = [...messages]
  const existing = next[existingIndex]
  next[existingIndex] = {
    ...existing,
    role,
    text: isFinal || !existing.text ? text : existing.text + text,
    isFinal: existing.isFinal || isFinal,
  }
  return next
}

function transcriptId(event: VoiceServerEvent, fallback: string): string {
  return getString(event, 'item_id') || getString(event, 'response_id') || fallback
}

export function useVoiceSession(audioElementRef: AudioElementRef) {
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [state, setState] = useState<VoiceSessionState>('idle')
  const [transcript, setTranscript] = useState<VoiceTranscriptMessage[]>([])
  const isMutedRef = useRef(false)
  const stateBeforeMuteRef = useRef<VoiceSessionState>('connected')
  const eventHandlerRef = useRef<(event: VoiceServerEvent) => void>(() => undefined)
  const clientRef = useRef<VoiceClient | null>(null)

  if (!clientRef.current) {
    clientRef.current = new VoiceClient({
      onEvent: (event) => eventHandlerRef.current(event),
      onError: (clientError) => {
        setError(clientError.message)
        setIsMuted(false)
        isMutedRef.current = false
        setState('error')
      },
      onPhase: (phase) => {
        if (phase === 'requesting-permission') setState('requesting-permission')
        if (phase === 'connecting') setState('connecting')
        if (phase === 'connected') setState(isMutedRef.current ? 'muted' : 'connected')
      },
    })
  }

  eventHandlerRef.current = (event) => {
    if (event.type === 'error') {
      setError(getEventError(event))
      setIsMuted(false)
      isMutedRef.current = false
      setState('error')
      return
    }

    if (event.type === 'input_audio_buffer.speech_started') {
      setState(isMutedRef.current ? 'muted' : 'listening')
      return
    }

    if (event.type === 'input_audio_buffer.speech_stopped') {
      setState(isMutedRef.current ? 'muted' : 'connected')
      return
    }

    if (event.type === 'conversation.item.input_audio_transcription.delta') {
      const delta = getString(event, 'delta')
      if (delta) {
        setTranscript((messages) => upsertTranscript(
          messages,
          transcriptId(event, 'user-live'),
          'user',
          delta,
          false,
        ))
      }
      return
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const text = getString(event, 'transcript')
      if (text) {
        setTranscript((messages) => upsertTranscript(
          messages,
          transcriptId(event, 'user-live'),
          'user',
          text,
          true,
        ))
      }
      return
    }

    if (event.type === 'response.output_audio_transcript.delta') {
      const delta = getString(event, 'delta')
      if (delta) {
        setState('speaking')
        setTranscript((messages) => upsertTranscript(
          messages,
          transcriptId(event, 'ronnie-live'),
          'ronnie',
          delta,
          false,
        ))
      }
      return
    }

    if (event.type === 'response.output_audio_transcript.done') {
      const text = getString(event, 'transcript')
      if (text) {
        setTranscript((messages) => upsertTranscript(
          messages,
          transcriptId(event, 'ronnie-live'),
          'ronnie',
          text,
          true,
        ))
      }
      return
    }

    if (event.type === 'response.done' || event.type === 'response.cancelled') {
      setState(isMutedRef.current ? 'muted' : 'connected')
    }
  }

  const begin = useCallback(async () => {
    if (!clientRef.current) return

    setError(null)
    setTranscript([])
    setIsMuted(false)
    isMutedRef.current = false
    clientRef.current.attachAudioElement(audioElementRef.current)

    try {
      await clientRef.current.connect()
    } catch {
      // VoiceClient reports the actionable error through onError above.
    }
  }, [audioElementRef])

  const start = useCallback(() => {
    if (state !== 'idle' && state !== 'error') return
    void begin()
  }, [begin, state])

  const retry = useCallback(() => {
    if (state !== 'error' || !clientRef.current) return
    clientRef.current.disconnect()
    void begin()
  }, [begin, state])

  const end = useCallback(() => {
    if (!clientRef.current || state === 'idle') return

    setState('ending')
    clientRef.current.disconnect()
    setIsMuted(false)
    isMutedRef.current = false
    setState('idle')
  }, [state])

  const toggleMute = useCallback(() => {
    if (!clientRef.current || (state !== 'connected' && state !== 'listening' && state !== 'speaking' && state !== 'muted')) {
      return
    }

    const nextMuted = !isMutedRef.current
    if (nextMuted) stateBeforeMuteRef.current = state
    const muted = clientRef.current.setMuted(nextMuted)
    setIsMuted(muted)
    isMutedRef.current = muted
    setState(muted ? 'muted' : stateBeforeMuteRef.current === 'speaking' ? 'speaking' : 'connected')
  }, [state])

  useEffect(() => () => {
    clientRef.current?.disconnect()
  }, [])

  const isActive = state !== 'idle' && state !== 'error'

  return {
    end,
    error,
    isActive,
    isMuted,
    retry,
    start,
    state,
    toggleMute,
    transcript,
  }
}
