export type AqiStandard = 'US_EPA' | 'INDIA_CPCB';

export type AqiCategoryName =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Poor'
  | 'Unhealthy'
  | 'Very Poor'
  | 'Very Unhealthy'
  | 'Severe'
  | 'Hazardous';

export interface AqiCategoryInfo {
  name: AqiCategoryName;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  icon: string;
  generalAdvice: string;
  sensitiveAdvice: string;
  outdoorActivity: 'safe' | 'caution' | 'limited' | 'avoid';
  maskRecommended: boolean;
  windowOpen: boolean;
}

export interface PollutantValues {
  pm25?: number | null;
  pm10?: number | null;
  o3?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
}

// US EPA Breakpoints: [C_low, C_high, I_low, I_high]
const US_EPA_BREAKPOINTS = {
  pm25: [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ],
  pm10: [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 504, 301, 400],
    [505, 604, 401, 500],
  ],
  no2: [
    [0, 53, 0, 50],
    [54, 100, 51, 100],
    [101, 360, 101, 150],
    [361, 649, 151, 200],
    [650, 1249, 201, 300],
    [1250, 1649, 301, 400],
    [1650, 2049, 401, 500],
  ],
  so2: [
    [0, 35, 0, 50],
    [36, 75, 51, 100],
    [76, 185, 101, 150],
    [186, 304, 151, 200],
    [305, 604, 201, 300],
    [605, 804, 301, 400],
    [805, 1004, 401, 500],
  ],
  o3: [
    [0, 54, 0, 50],
    [55, 70, 51, 100],
    [71, 85, 101, 150],
    [86, 105, 151, 200],
    [106, 200, 201, 300],
    [201, 404, 301, 400],
    [405, 504, 401, 500],
  ],
  co: [
    [0.0, 4.4, 0, 50],
    [4.5, 9.4, 51, 100],
    [9.5, 12.4, 101, 150],
    [12.5, 15.4, 151, 200],
    [15.5, 30.4, 201, 300],
    [30.5, 40.4, 301, 400],
    [40.5, 50.4, 401, 500],
  ],
};

// India CPCB Breakpoints: [C_low, C_high, I_low, I_high]
const CPCB_BREAKPOINTS = {
  pm25: [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, 380, 401, 500],
  ],
  pm10: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 250, 101, 200],
    [251, 350, 201, 300],
    [351, 430, 301, 400],
    [431, 550, 401, 500],
  ],
  no2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 180, 101, 200],
    [181, 280, 201, 300],
    [281, 400, 301, 400],
    [401, 550, 401, 500],
  ],
  so2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 380, 101, 200],
    [381, 800, 201, 300],
    [801, 1600, 301, 400],
    [1601, 2100, 401, 500],
  ],
  o3: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 168, 101, 200],
    [169, 208, 201, 300],
    [209, 748, 301, 400],
    [749, 1000, 401, 500],
  ],
  co: [
    [0, 1.0, 0, 50],
    [1.1, 2.0, 51, 100],
    [2.1, 10.0, 101, 200],
    [10.1, 17.0, 201, 300],
    [17.1, 34.0, 301, 400],
    [34.1, 50.0, 401, 500],
  ],
};

function calculateSubIndex(val: number, breakpoints: number[][]): number {
  if (val < 0) return 0;
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (val >= cLow && val <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (val - cLow) + iLow);
    }
  }
  // Above top range
  const last = breakpoints[breakpoints.length - 1];
  if (val > last[1]) {
    const overflow = Math.round(
      ((last[3] - last[2]) / (last[1] - last[0])) * (val - last[0]) + last[2]
    );
    return Math.min(500, overflow);
  }
  return 0;
}

export function calculatePollutantAqi(
  pollutant: keyof PollutantValues,
  value: number | null | undefined,
  standard: AqiStandard = 'US_EPA'
): number | null {
  if (value === null || value === undefined || isNaN(value) || value < 0) return null;
  const table = standard === 'US_EPA' ? US_EPA_BREAKPOINTS : CPCB_BREAKPOINTS;
  const bp = table[pollutant];
  if (!bp) return null;

  let val = value;
  // Convert Ozone from µg/m³ to ppb for US EPA standard table (1 ppb O3 ≈ 2.0 µg/m³)
  if (pollutant === 'o3' && standard === 'US_EPA') {
    val = value / 2.0;
  }

  return calculateSubIndex(val, bp);
}

export function calculateOverallAqi(
  pollutants: PollutantValues,
  standard: AqiStandard = 'US_EPA'
): { aqi: number; dominant: string | null; subIndices: Record<string, number> } {
  let maxAqi = 0;
  let dominant: string | null = null;
  const subIndices: Record<string, number> = {};

  const keys: (keyof PollutantValues)[] = ['pm25', 'pm10', 'no2', 'so2', 'o3', 'co'];
  for (const k of keys) {
    const val = pollutants[k];
    if (val !== undefined && val !== null) {
      const idx = calculatePollutantAqi(k, val, standard);
      if (idx !== null) {
        subIndices[k] = idx;
        if (idx > maxAqi) {
          maxAqi = idx;
          dominant = k;
        }
      }
    }
  }

  return { aqi: maxAqi, dominant, subIndices };
}

export function getAqiCategory(aqi: number, standard: AqiStandard = 'US_EPA'): AqiCategoryInfo {
  const safeAqi = Math.max(0, Math.round(aqi));

  if (standard === 'US_EPA') {
    if (safeAqi <= 50) {
      return {
        name: 'Good',
        level: 1,
        color: '#10b981', // emerald-500
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: '#10b981',
        textColor: '#059669',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: 'Smile',
        generalAdvice: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        sensitiveAdvice: 'None. Safe for all groups.',
        outdoorActivity: 'safe',
        maskRecommended: false,
        windowOpen: true,
      };
    } else if (safeAqi <= 100) {
      return {
        name: 'Moderate',
        level: 2,
        color: '#f59e0b', // amber-500
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: '#f59e0b',
        textColor: '#d97706',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: 'Meh',
        generalAdvice: 'Air quality is acceptable; however, sensitive people may experience minor respiratory irritation.',
        sensitiveAdvice: 'Unusually sensitive people should consider reducing prolonged outdoor exertion.',
        outdoorActivity: 'caution',
        maskRecommended: false,
        windowOpen: true,
      };
    } else if (safeAqi <= 150) {
      return {
        name: 'Unhealthy for Sensitive Groups',
        level: 3,
        color: '#f97316', // orange-500
        bgColor: 'rgba(249, 115, 22, 0.12)',
        borderColor: '#f97316',
        textColor: '#ea580c',
        badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        icon: 'AlertTriangle',
        generalAdvice: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
        sensitiveAdvice: 'People with respiratory or heart disease, the elderly, and children should limit prolonged outdoor exertion.',
        outdoorActivity: 'limited',
        maskRecommended: true,
        windowOpen: false,
      };
    } else if (safeAqi <= 200) {
      return {
        name: 'Unhealthy',
        level: 4,
        color: '#ef4444', // red-500
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: '#ef4444',
        textColor: '#dc2626',
        badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: 'AlertOctagon',
        generalAdvice: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
        sensitiveAdvice: 'Active children and adults, and people with respiratory illness should avoid prolonged outdoor exertion.',
        outdoorActivity: 'avoid',
        maskRecommended: true,
        windowOpen: false,
      };
    } else if (safeAqi <= 300) {
      return {
        name: 'Very Unhealthy',
        level: 5,
        color: '#a855f7', // purple-500
        bgColor: 'rgba(168, 85, 247, 0.12)',
        borderColor: '#a855f7',
        textColor: '#9333ea',
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: 'Skull',
        generalAdvice: 'Health alert: The risk of health effects is increased for everyone. Avoid outdoor physical activities.',
        sensitiveAdvice: 'Everyone should avoid outdoor exertion. Sensitive groups should remain indoors with air purifiers.',
        outdoorActivity: 'avoid',
        maskRecommended: true,
        windowOpen: false,
      };
    } else {
      return {
        name: 'Hazardous',
        level: 6,
        color: '#881337', // rose-900 / maroon
        bgColor: 'rgba(136, 19, 55, 0.2)',
        borderColor: '#881337',
        textColor: '#be123c',
        badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-700/50',
        icon: 'Biohazard',
        generalAdvice: 'Health warning of emergency conditions: The entire population is even more likely to be seriously affected.',
        sensitiveAdvice: 'Remain indoors with closed windows and HEPA filtration. Wear N95/N99 respirators if stepping outside.',
        outdoorActivity: 'avoid',
        maskRecommended: true,
        windowOpen: false,
      };
    }
  } else {
    // India CPCB Standard
    if (safeAqi <= 50) {
      return {
        name: 'Good',
        level: 1,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: '#10b981',
        textColor: '#059669',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: 'Smile',
        generalAdvice: 'Minimal impact. Clean and fresh ambient air.',
        sensitiveAdvice: 'Safe for everyone.',
        outdoorActivity: 'safe',
        maskRecommended: false,
        windowOpen: true,
      };
    } else if (safeAqi <= 100) {
      return {
        name: 'Satisfactory',
        level: 2,
        color: '#84cc16', // lime-500
        bgColor: 'rgba(132, 204, 22, 0.12)',
        borderColor: '#84cc16',
        textColor: '#65a30d',
        badgeBg: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
        icon: 'Smile',
        generalAdvice: 'Minor breathing discomfort to sensitive people.',
        sensitiveAdvice: 'Sensitive individuals should monitor symptoms.',
        outdoorActivity: 'safe',
        maskRecommended: false,
        windowOpen: true,
      };
    } else if (safeAqi <= 200) {
      return {
        name: 'Moderate',
        level: 3,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: '#f59e0b',
        textColor: '#d97706',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: 'Meh',
        generalAdvice: 'Breathing discomfort to people with lung disease such as asthma, and discomfort to humans with heart diseases, children and older adults.',
        sensitiveAdvice: 'Limit prolonged outdoor exertion for vulnerable groups.',
        outdoorActivity: 'caution',
        maskRecommended: true,
        windowOpen: false,
      };
    } else if (safeAqi <= 300) {
      return {
        name: 'Poor',
        level: 4,
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.12)',
        borderColor: '#f97316',
        textColor: '#ea580c',
        badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        icon: 'AlertTriangle',
        generalAdvice: 'Breathing discomfort to people on prolonged exposure and discomfort to people with heart diseases.',
        sensitiveAdvice: 'Avoid outdoor morning walks and heavy physical activities.',
        outdoorActivity: 'limited',
        maskRecommended: true,
        windowOpen: false,
      };
    } else if (safeAqi <= 400) {
      return {
        name: 'Very Poor',
        level: 5,
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: '#ef4444',
        textColor: '#dc2626',
        badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: 'AlertOctagon',
        generalAdvice: 'Respiratory illness on prolonged exposure. Pronounced effect on people with lung and heart diseases.',
        sensitiveAdvice: 'Children and elderly should stay indoors with windows shut.',
        outdoorActivity: 'avoid',
        maskRecommended: true,
        windowOpen: false,
      };
    } else {
      return {
        name: 'Severe',
        level: 6,
        color: '#881337',
        bgColor: 'rgba(136, 19, 55, 0.2)',
        borderColor: '#881337',
        textColor: '#be123c',
        badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-700/50',
        icon: 'Biohazard',
        generalAdvice: 'Affects healthy people and seriously impacts those with existing diseases. Emergency pollution levels.',
        sensitiveAdvice: 'Strict indoor confinement. Use high-efficiency particulate air (HEPA) filters.',
        outdoorActivity: 'avoid',
        maskRecommended: true,
        windowOpen: false,
      };
    }
  }
}

export interface SpikeDetectionResult {
  isSpike: boolean;
  value: number;
  mean: number;
  stdDev: number;
  threshold: number;
  deviationMultiplier: number;
  timestamp: string;
}

/**
 * Detects pollution spikes in a time series using rolling mean + 2 std deviations.
 */
export function detectPollutionSpikes(
  data: { timestamp: string; value: number }[],
  windowSize = 24
): SpikeDetectionResult[] {
  if (!data || data.length === 0) return [];

  const results: SpikeDetectionResult[] = [];

  for (let i = 0; i < data.length; i++) {
    // Window of preceding points
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1).map((d) => d.value).filter((v) => !isNaN(v));

    if (window.length < 3) {
      results.push({
        isSpike: false,
        value: data[i].value,
        mean: data[i].value,
        stdDev: 0,
        threshold: data[i].value,
        deviationMultiplier: 0,
        timestamp: data[i].timestamp,
      });
      continue;
    }

    const mean = window.reduce((sum, v) => sum + v, 0) / window.length;
    const variance = window.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;
    const isSpike = stdDev > 0 && data[i].value > threshold;
    const deviationMultiplier = stdDev > 0 ? (data[i].value - mean) / stdDev : 0;

    results.push({
      isSpike,
      value: data[i].value,
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      threshold: Math.round(threshold * 10) / 10,
      deviationMultiplier: Math.round(deviationMultiplier * 100) / 100,
      timestamp: data[i].timestamp,
    });
  }

  return results;
}

/**
 * Calculates percentage change between current and previous values.
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Compares two values and returns a friendly multiplier (e.g. 2.3x)
 */
export function calculateDifferenceMultiplier(val1: number, val2: number): string {
  if (val2 <= 0) return 'N/A';
  const ratio = val1 / val2;
  return `${ratio.toFixed(1)}x`;
}

/**
 * Formats relative time (e.g., "12 min ago", "just now", "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'recently';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
