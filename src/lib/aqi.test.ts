import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePollutantAqi,
  calculateOverallAqi,
  getAqiCategory,
  detectPollutionSpikes,
  calculatePercentChange,
  calculateDifferenceMultiplier,
  getUvCategoryInfo,
} from './aqi';

test('US EPA PM2.5 calculation breakpoints', () => {
  // 0 - 12 µg/m³ -> 0 - 50 AQI
  assert.equal(calculatePollutantAqi('pm25', 0, 'US_EPA'), 0);
  assert.equal(calculatePollutantAqi('pm25', 12.0, 'US_EPA'), 50);

  // 12.1 - 35.4 µg/m³ -> 51 - 100 AQI
  const moderate = calculatePollutantAqi('pm25', 25.0, 'US_EPA');
  assert.ok(moderate !== null && moderate >= 51 && moderate <= 100);

  // 55.5 - 150.4 µg/m³ -> 151 - 200 AQI (Unhealthy)
  const unhealthy = calculatePollutantAqi('pm25', 65.0, 'US_EPA');
  assert.ok(unhealthy !== null && unhealthy >= 151 && unhealthy <= 200);

  // Null/negative values return null
  assert.equal(calculatePollutantAqi('pm25', null, 'US_EPA'), null);
  assert.equal(calculatePollutantAqi('pm25', -5, 'US_EPA'), null);
});

test('India CPCB PM2.5 calculation breakpoints', () => {
  // 0 - 30 -> 0 - 50 Good
  assert.equal(calculatePollutantAqi('pm25', 15, 'INDIA_CPCB'), 25);
  // 31 - 60 -> 51 - 100 Satisfactory
  const sat = calculatePollutantAqi('pm25', 45, 'INDIA_CPCB');
  assert.ok(sat !== null && sat >= 51 && sat <= 100);
  // 121 - 250 -> 301 - 400 Very Poor
  const veryPoor = calculatePollutantAqi('pm25', 150, 'INDIA_CPCB');
  assert.ok(veryPoor !== null && veryPoor >= 301 && veryPoor <= 400);
});

test('Overall AQI derives max pollutant sub-index and dominant pollutant', () => {
  const result = calculateOverallAqi({
    pm25: 12.0, // AQI 50
    pm10: 154,  // AQI 100
    no2: 20,
  }, 'US_EPA');

  assert.equal(result.aqi, 100);
  assert.equal(result.dominant, 'pm10');
  assert.equal(result.subIndices.pm25, 50);
  assert.equal(result.subIndices.pm10, 100);
});

test('AQI categories for US EPA and India CPCB', () => {
  const epaGood = getAqiCategory(35, 'US_EPA');
  assert.equal(epaGood.name, 'Good');
  assert.equal(epaGood.outdoorActivity, 'safe');

  const epaHazardous = getAqiCategory(350, 'US_EPA');
  assert.equal(epaHazardous.name, 'Hazardous');
  assert.equal(epaHazardous.maskRecommended, true);

  const cpcbMod = getAqiCategory(150, 'INDIA_CPCB');
  assert.equal(cpcbMod.name, 'Moderate');

  const cpcbSevere = getAqiCategory(450, 'INDIA_CPCB');
  assert.equal(cpcbSevere.name, 'Severe');
});

test('Spike detection flags values exceeding mean + 2 std deviations', () => {
  const series = [
    { timestamp: '2026-11-01T00:00:00Z', value: 20 },
    { timestamp: '2026-11-01T01:00:00Z', value: 22 },
    { timestamp: '2026-11-01T02:00:00Z', value: 21 },
    { timestamp: '2026-11-01T03:00:00Z', value: 23 },
    { timestamp: '2026-11-01T04:00:00Z', value: 19 },
    { timestamp: '2026-11-01T05:00:00Z', value: 21 },
    { timestamp: '2026-11-01T06:00:00Z', value: 150 }, // Massive spike
  ];

  const results = detectPollutionSpikes(series, 10);
  assert.equal(results.length, 7);
  const last = results[results.length - 1];
  assert.equal(last.isSpike, true);
  assert.ok(last.deviationMultiplier > 2.0);
  // Earlier steady point is not a spike
  assert.equal(results[2].isSpike, false);
});

test('Percentage change and difference multiplier math', () => {
  assert.equal(calculatePercentChange(150, 100), 50);
  assert.equal(calculatePercentChange(80, 100), -20);
  assert.equal(calculatePercentChange(10, 0), 100);

  assert.equal(calculateDifferenceMultiplier(230, 100), '2.3x');
  assert.equal(calculateDifferenceMultiplier(50, 50), '1.0x');
});

test('UV Index category and protection advice derivation', () => {
  const low = getUvCategoryInfo(1.5, true);
  assert.equal(low.name, 'Low');
  assert.equal(low.burnTimeMinutes, 60);

  const mod = getUvCategoryInfo(4.5, true);
  assert.equal(mod.name, 'Moderate');
  assert.equal(mod.burnTimeMinutes, 40);

  const high = getUvCategoryInfo(7.2, true);
  assert.equal(high.name, 'High');
  assert.equal(high.burnTimeMinutes, 20);

  const extreme = getUvCategoryInfo(11.5, true);
  assert.equal(extreme.name, 'Extreme');
  assert.equal(extreme.burnTimeMinutes, 8);

  const night = getUvCategoryInfo(5.0, false);
  assert.equal(night.name, 'Low');
  assert.equal(night.riskLevel, 'Minimal');
});
