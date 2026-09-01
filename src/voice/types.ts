export const voiceSessionStates = [
  'idle',
  'requesting-permission',
  'connecting',
  'connected',
  'listening',
  'speaking',
  'muted',
  'ending',
  'error',
] as const

export type VoiceSessionState = (typeof voiceSessionStates)[number]

export type VoiceTranscriptRole = 'user' | 'ronnie'

export interface VoiceTranscriptMessage {
  id: string
  role: VoiceTranscriptRole
  text: string
  isFinal: boolean
}

export interface VoiceServerEvent {
  type: string
  [key: string]: unknown
}
