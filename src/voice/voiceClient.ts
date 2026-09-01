import type { VoiceServerEvent } from './types'

type VoiceClientPhase = 'requesting-permission' | 'connecting' | 'connected'

type VoiceClientCallbacks = {
  onEvent: (event: VoiceServerEvent) => void
  onError: (error: Error) => void
  onPhase: (phase: VoiceClientPhase) => void
}

function toError(error: unknown, fallback = 'Unable to connect to Ronnie.') {
  return error instanceof Error ? error : new Error(fallback)
}

function readProviderError(body: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object' || !('error' in parsed)) return undefined

    const error = parsed.error
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message
    }
  } catch {
    return undefined
  }

  return undefined
}

function readRealtimeError(event: VoiceServerEvent): string {
  const error = event.error
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Ronnie reported a realtime conversation error.'
}

export class VoiceClient {
  private audioElement: HTMLAudioElement | null = null
  private connectAbortController: AbortController | null = null
  private dataChannel: RTCDataChannel | null = null
  private intentionallyClosing = false
  private localStream: MediaStream | null = null
  private peerConnection: RTCPeerConnection | null = null
  private sessionGeneration = 0

  constructor(private readonly callbacks: VoiceClientCallbacks) {}

  attachAudioElement(audioElement: HTMLAudioElement | null): void {
    this.audioElement = audioElement
  }

  async connect(): Promise<void> {
    if (this.peerConnection || this.connectAbortController) return

    this.intentionallyClosing = false
    const generation = ++this.sessionGeneration
    const abortController = new AbortController()
    this.connectAbortController = abortController
    let localStream: MediaStream | null = null
    let peerConnection: RTCPeerConnection | null = null
    this.callbacks.onPhase('requesting-permission')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support microphone access.')
      }

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!this.isCurrent(generation)) {
        localStream.getTracks().forEach((track) => track.stop())
        return
      }

      this.localStream = localStream
      this.callbacks.onPhase('connecting')

      peerConnection = new RTCPeerConnection()
      if (!this.isCurrent(generation)) {
        peerConnection.close()
        localStream.getTracks().forEach((track) => track.stop())
        return
      }

      this.peerConnection = peerConnection
      peerConnection.onconnectionstatechange = () => {
        if (!this.isCurrent(generation)) return
        if (peerConnection?.connectionState === 'connected') {
          this.callbacks.onPhase('connected')
        } else if (peerConnection?.connectionState === 'failed' || peerConnection?.connectionState === 'disconnected') {
          this.fail(new Error('The realtime connection was lost.'))
        }
      }
      peerConnection.oniceconnectionstatechange = () => {
        if (!this.isCurrent(generation)) return
        if (peerConnection?.iceConnectionState === 'failed' || peerConnection?.iceConnectionState === 'closed') {
          this.fail(new Error('The network connection to Ronnie failed.'))
        }
      }
      peerConnection.ontrack = (event) => {
        if (!this.isCurrent(generation)) return
        const stream = event.streams[0] ?? new MediaStream([event.track])
        if (!this.audioElement) return

        this.audioElement.srcObject = stream
        void this.audioElement.play().catch(() => {
          // The user gesture that starts the session normally permits playback.
          // The audio element remains available if the browser delays autoplay.
        })
      }

      localStream.getTracks().forEach((track) => peerConnection?.addTrack(track, localStream as MediaStream))
      this.dataChannel = peerConnection.createDataChannel('oai-events')
      this.dataChannel.addEventListener('open', () => {
        if (this.isCurrent(generation)) this.callbacks.onPhase('connected')
      })
      this.dataChannel.addEventListener('message', (event) => {
        if (this.isCurrent(generation)) this.handleDataChannelMessage(event.data)
      })

      const offer = await peerConnection.createOffer()
      if (!this.isCurrent(generation)) return
      await peerConnection.setLocalDescription(offer)
      if (!this.isCurrent(generation)) return
      const localDescription = peerConnection.localDescription
      if (!localDescription?.sdp) {
        throw new Error('The browser could not create a session offer.')
      }

      const response = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: localDescription.sdp,
        signal: abortController.signal,
      })
      if (!this.isCurrent(generation)) return

      if (!response.ok) {
        const body = await response.text()
        throw new Error(readProviderError(body) || 'The voice server could not create a session.')
      }

      const answer = await response.text()
      if (!this.isCurrent(generation)) return
      if (!answer.trim()) {
        throw new Error('The voice server returned an empty session answer.')
      }

      await peerConnection.setRemoteDescription({ type: 'answer', sdp: answer })
    } catch (error) {
      const isCurrentSession = this.isCurrent(generation)
      if (this.connectAbortController === abortController) this.connectAbortController = null

      if (this.localStream !== localStream) localStream?.getTracks().forEach((track) => track.stop())
      if (peerConnection && this.peerConnection !== peerConnection) peerConnection.close()
      if (!isCurrentSession) return

      const connectionError = toError(error)
      this.cleanup()
      this.callbacks.onError(connectionError)
      throw connectionError
    } finally {
      if (this.connectAbortController === abortController) this.connectAbortController = null
    }
  }

  setMuted(muted: boolean): boolean {
    if (!this.localStream) return false

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
    return muted
  }

  disconnect(): void {
    this.intentionallyClosing = true
    this.sessionGeneration += 1
    this.connectAbortController?.abort()
    this.connectAbortController = null
    this.cleanup()
  }

  private handleDataChannelMessage(data: unknown): void {
    if (typeof data !== 'string') return

    try {
      const event: unknown = JSON.parse(data)
      if (!event || typeof event !== 'object' || !('type' in event) || typeof event.type !== 'string') return
      const realtimeEvent = event as VoiceServerEvent
      if (realtimeEvent.type === 'error') {
        this.fail(new Error(readRealtimeError(realtimeEvent)))
        return
      }
      this.callbacks.onEvent(realtimeEvent)
    } catch {
      this.fail(new Error('Ronnie sent an unreadable realtime event.'))
    }
  }

  private fail(error: Error): void {
    if (this.intentionallyClosing) return
    this.intentionallyClosing = true
    this.sessionGeneration += 1
    this.connectAbortController?.abort()
    this.connectAbortController = null
    this.cleanup()
    this.callbacks.onError(error)
  }

  private isCurrent(generation: number): boolean {
    return generation === this.sessionGeneration && !this.intentionallyClosing
  }

  private cleanup(): void {
    this.dataChannel?.close()
    this.dataChannel = null

    this.peerConnection?.close()
    this.peerConnection = null

    this.localStream?.getTracks().forEach((track) => track.stop())
    this.localStream = null

    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.srcObject = null
    }
  }
}
