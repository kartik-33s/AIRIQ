import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSoundscapeState,
  setSoundscapePreset,
  setSoundscapeVolume,
  updateSoundscapeAqi,
  getSoundscapeProfileInfo,
} from './ambientSoundscape';

test('Initial soundscape state has safe defaults', () => {
  const state = getSoundscapeState();
  assert.equal(state.isPlaying, false);
  assert.ok(state.volume > 0 && state.volume <= 1);
  assert.equal(state.preset, 'auto');
  assert.ok(state.activeProfileName.length > 0);
});

test('Soundscape volume changes within clamped range', () => {
  setSoundscapeVolume(0.8);
  assert.equal(getSoundscapeState().volume, 0.8);

  setSoundscapeVolume(1.5); // clamps to 1
  assert.equal(getSoundscapeState().volume, 1.0);

  setSoundscapeVolume(-0.2); // clamps to 0
  assert.equal(getSoundscapeState().volume, 0.0);

  // Restore reasonable default
  setSoundscapeVolume(0.45);
});

test('AQI thresholds map to appropriate soundscape profiles in auto mode', () => {
  setSoundscapePreset('auto');

  // Clean AQI (0 - 50) -> Forest & Songbirds
  updateSoundscapeAqi(30);
  const cleanProfile = getSoundscapeProfileInfo();
  assert.ok(cleanProfile.name.includes('Forest'));

  // Moderate AQI (51 - 100) -> Meadow Breeze
  updateSoundscapeAqi(75);
  const moderateProfile = getSoundscapeProfileInfo();
  assert.ok(moderateProfile.name.includes('Meadow'));

  // Unhealthy AQI (101 - 175) -> Suburban Haze
  updateSoundscapeAqi(140);
  const hazeProfile = getSoundscapeProfileInfo();
  assert.ok(hazeProfile.name.includes('Haze'));

  // Severe AQI (176+) -> Industrial Smog Drone
  updateSoundscapeAqi(250);
  const severeProfile = getSoundscapeProfileInfo();
  assert.ok(severeProfile.name.includes('Industrial'));
});

test('Manual presets override AQI calculations', () => {
  updateSoundscapeAqi(25); // Clean AQI
  setSoundscapePreset('industrial');
  const forcedProfile = getSoundscapeProfileInfo();
  assert.ok(forcedProfile.name.includes('Industrial'));

  // Reset back to auto
  setSoundscapePreset('auto');
});
