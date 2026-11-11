import { useState, useEffect } from 'react';
import {
  SoundscapeState,
  getSoundscapeState,
  subscribeSoundscape,
  toggleSoundscape,
  startSoundscape,
  stopSoundscape,
  setSoundscapeVolume,
  setSoundscapePreset,
  updateSoundscapeAqi,
  SoundscapePreset,
} from './ambientSoundscape';

export function useAmbientSoundscape(aqi?: number) {
  const [state, setState] = useState<SoundscapeState>(() => getSoundscapeState());

  useEffect(() => {
    const unsub = subscribeSoundscape((nextState) => {
      setState(nextState);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (typeof aqi === 'number') {
      updateSoundscapeAqi(aqi);
    }
  }, [aqi]);

  return {
    state,
    isPlaying: state.isPlaying,
    volume: state.volume,
    preset: state.preset,
    activeProfileName: state.activeProfileName,
    activeProfileDescription: state.activeProfileDescription,
    toggle: toggleSoundscape,
    start: startSoundscape,
    stop: stopSoundscape,
    setVolume: setSoundscapeVolume,
    setPreset: (preset: SoundscapePreset) => setSoundscapePreset(preset),
  };
}
