import { useSettingsStore } from '../store/settingsStore'

export function useSilentMode() {
  const isSilent = useSettingsStore(state => state.voice.ttsSilentMode)
  return { isSilent }
}
