import { useVoiceCommand } from '../hooks/useVoiceCommand'

export function VoiceButton() {
  const {
    recording,
    processing,
    transcript,
    result,
    recorderError,
    startRecording,
    stopRecording,
  } = useVoiceCommand()

  const handleClick = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  const statusColor = result?.status === 'ok' ? '#2a7' : result?.status === 'error' ? '#c00' : '#555'

  return (
    <div className="voice-widget">
      <button
        className={`voice-btn ${recording ? 'voice-btn--recording' : ''} ${processing ? 'voice-btn--processing' : ''}`}
        onClick={handleClick}
        disabled={processing}
        aria-label={recording ? 'Zatrzymaj nagrywanie' : 'Nagraj komendę głosową'}
        title={recording ? 'Kliknij, aby zatrzymać' : 'Kliknij, aby nagrać komendę'}
      >
        {processing ? '⏳' : recording ? '⏹' : '🎤'}
      </button>

      {recording && <p className="voice-status">Nagrywanie… kliknij, aby zatrzymać</p>}
      {processing && <p className="voice-status">Przetwarzanie…</p>}

      {!recording && !processing && transcript && (
        <p className="voice-transcript">„{transcript}"</p>
      )}

      {!recording && !processing && result && (
        <p className="voice-result" style={{ color: statusColor }}>
          {result.status === 'ok' ? '✓ ' : result.status === 'error' ? '✗ ' : 'ℹ '}
          {result.message}
        </p>
      )}

      {recorderError && (
        <p className="voice-result" style={{ color: '#c00' }}>✗ {recorderError}</p>
      )}
    </div>
  )
}
