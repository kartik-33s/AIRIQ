import { AqiStandard, AqiCategoryName, AqiCategoryInfo } from '../lib/aqi';

export type { AqiStandard, AqiCategoryName, AqiCategoryInfo };

export type ActiveTab = 'dashboard' | 'map' | '3d' | 'history' | 'forecast' | 'comparison' | 'health' | 'champion';

export interface SparklinePoint {
  time: string;
  hour: string;
  aqi: number;
  pm25?: number | null;
  pm10?: number | null;
}

export interface UvData {
  uvIndex: number;
  maxUvToday?: number | null;
  solarRadiation?: number | null; // shortwave radiation in W/m²
  isDay: boolean;
  category: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  color: string;
  burnTimeMinutes?: number | null;
  protectionAdvice: string;
  spfRecommendation: string;
}

export interface WindVectorPoint {
  lat: number;
  lng: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees 0-360
  windGusts?: number;
  pm25?: number | null;
}

export interface WindDispersionData {
  center: {
    lat: number;
    lng: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    dust: number | null;
    aod: number | null;
    pm25: number | null;
  };
  grid: WindVectorPoint[];
  cardinal: string;
  originAnalysis: {
    title: string;
    description: string;
    sourceRegion: string;
    flowType: 'continental_smoke' | 'maritime_clear' | 'desert_dust' | 'stagnant_inversion' | 'standard_dispersion';
  };
  ventilation: {
    status: 'Stagnant Trap' | 'Moderate Dispersion' | 'Strong Ventilation';
    score: number;
    riskLevel: 'Severe Risk' | 'Caution' | 'Favorable';
    advice: string;
  };
}

export interface LocationData {
  city: string;
  stationName: string;
  coordinates: { lat: number; lng: number };
  aqi: number;
  standard: AqiStandard;
  dominant: string | null;
  badge: 'Measured' | 'Modeled estimate' | 'Forecast';
  sourceName: string;
  lastUpdated: string;
  weather: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  };
  pollutants: {
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
  };
  subIndices?: Record<string, number>;
  sparkline?: SparklinePoint[];
  uv?: UvData;
  windDispersion?: WindDispersionData;
}

export interface MapStation {
  uid: number | string;
  lat: number;
  lng: number;
  aqi: number;
  name: string;
  time: string;
  badge: 'Measured' | 'Modeled estimate' | 'Forecast';
  source: string;
}

export interface ForecastPoint {
  time: string;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  isPast: boolean;
  confidenceLower: number;
  confidenceUpper: number;
  badge: 'Forecast';
}

export interface DailyForecast {
  date: string;
  avgAqi: number;
  maxAqi: number;
  minAqi: number;
  avgPm25: number;
  bestTime: string;
  badge: 'Forecast';
  sourceName: string;
}

export interface HistoricalPoint {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  isSpike: boolean;
  threshold: number;
  mean: number;
  deviationMultiplier: number;
  badge: 'Modeled estimate';
  source: string;
}

export interface HistoryData {
  days: number;
  daily: HistoricalPoint[];
  spikes: HistoricalPoint[];
  periodChangePct: number;
  prevPeriodAvg: number;
  currentPeriodAvg: number;
  badge: 'Modeled estimate';
  source: string;
  lastUpdated: string;
}

export interface SmartAlert {
  id: string;
  city: string;
  threshold: number;
  enabled: boolean;
  standard: AqiStandard;
}
