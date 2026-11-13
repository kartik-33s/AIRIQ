import React, { useState, useEffect } from 'react';
import {
  Layers,
  Wind,
  Sun,
  MapPin,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Volume2,
  VolumeX,
  Compass,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Sparkles,
  CloudFog,
} from 'lucide-react';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory } from '../lib/aqi';
import {
  Atmospheric3DScene,
  CameraViewPreset,
} from '../components/3d/Atmospheric3DScene';
import { SensorPartId, STATION_SENSORS } from '../components/3d/sensorData';
import {
  setAudioMuted,
  getAudioMuted,
  setWindSoundSpeed,
  playTelemetryChirp,
} from '../lib/audioTelemetry';

interface Atmospheric3DViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
  onSelectCity: (city: string) => void;
  onUseCurrentLocation: () => void;
  isLocating?: boolean;
}

type ScenarioId = 'live' | 'delhi_inversion' | 'sea_breeze' | 'biomass_smoke' | 'ozone_peak';

export const Atmospheric3DView: React.FC<Atmospheric3DViewProps> = ({
  currentLocation,
  standard,
  onSelectCity,
  onUseCurrentLocation,
  isLocating,
}) => {
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('hero');
  const [explodedFactor, setExplodedFactor] = useState<number>(0.0);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showInversionCap, setShowInversionCap] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<number>(0.5); // 0.5 = midday
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight < 680;
    }
    return false;
  });
  const [activeDockTab, setActiveDockTab] = useState<'sensors' | 'assembly' | 'simulation' | 'environment'>('sensors');

  const [selectedSensorId, setSelectedSensorId] = useState<SensorPartId | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('live');
  const [simulatedAqi, setSimulatedAqi] = useState<number | null>(null);
  const [simulatedWindSpeed, setSimulatedWindSpeed] = useState<number | null>(null);
  const [isMuted, setIsMutedState] = useState<boolean>(true);

  const popularCities = ['Delhi', 'London', 'New York', 'Tokyo', 'Sydney', 'Paris'];

  // Sync initial mute state
  useEffect(() => {
    setIsMutedState(getAudioMuted());
  }, []);

  // Update wind audio frequency when wind changes
  useEffect(() => {
    const windSpeed = simulatedWindSpeed ?? currentLocation?.weather.windSpeed ?? 10;
    setWindSoundSpeed(windSpeed);
  }, [simulatedWindSpeed, currentLocation?.weather.windSpeed]);

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedSensorId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scenario Switcher
  const applyScenario = (sc: ScenarioId) => {
    setActiveScenario(sc);
    playTelemetryChirp(1200);

    if (sc === 'live') {
      setSimulatedAqi(null);
      setSimulatedWindSpeed(null);
      setShowInversionCap(true);
      setTimeOfDay(0.5);
    } else if (sc === 'delhi_inversion') {
      setSimulatedAqi(440);
      setSimulatedWindSpeed(3);
      setShowInversionCap(true);
      setTimeOfDay(0.35); // cold early morning winter inversion
      setCameraPreset('inversion');
    } else if (sc === 'sea_breeze') {
      setSimulatedAqi(24);
      setSimulatedWindSpeed(26);
      setShowInversionCap(false);
      setTimeOfDay(0.5);
      setCameraPreset('dispersion');
    } else if (sc === 'biomass_smoke') {
      setSimulatedAqi(295);
      setSimulatedWindSpeed(12);
      setShowInversionCap(true);
      setTimeOfDay(0.72); // sunset haze
      setCameraPreset('dispersion');
    } else if (sc === 'ozone_peak') {
      setSimulatedAqi(165);
      setSimulatedWindSpeed(6);
      setShowInversionCap(false);
      setTimeOfDay(0.5); // peak midday UV sun
    }
  };

  const toggleSound = () => {
    const newMuted = !isMuted;
    setAudioMuted(newMuted);
    setIsMutedState(newMuted);
    if (!newMuted) playTelemetryChirp(1800);
  };

  const handleSelectSensor = (sid: SensorPartId) => {
    setSelectedSensorId(sid);
    setCameraPreset('macro');
    playTelemetryChirp(1600);
  };

  const curAqi = simulatedAqi ?? currentLocation?.aqi ?? 100;
  const category = getAqiCategory(curAqi, standard);
  const activeSensor = selectedSensorId ? STATION_SENSORS[selectedSensorId] : null;

  // Retrieve sensor live value from current location
  const getSensorReading = (sid: SensorPartId) => {
    if (!currentLocation) return '100% Nominal';
    switch (sid) {
      case 'nephelometer':
        return `${currentLocation.pollutants.pm25 ?? 45} µg/m³ (PM2.5)`;
      case 'radiometer':
        return `${currentLocation.uv?.uvIndex.toFixed(1) ?? '4.2'} UVI (${currentLocation.uv?.category ?? 'Moderate'})`;
      case 'anemometer':
        return `${simulatedWindSpeed ?? currentLocation.weather.windSpeed ?? 8} km/h (${currentLocation.windDispersion?.cardinal ?? 'NW'})`;
      case 'gas_analyzer':
        return `NO₂: ${currentLocation.pollutants.no2 ?? 28} | O₃: ${currentLocation.pollutants.o3 ?? 45} µg/m³`;
      case 'solar':
        return '45W Peak / 98% LiFePO4 Reserve';
      case 'beacon':
        return `${category.name} (AQI ${curAqi})`;
      case 'avionics':
        return 'Copernicus CAMS 11km Linked [OK]';
      case 'pedestal':
        return '45 MPa Seismic Damped [Calibrated]';
      default:
        return 'Nominal';
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-8.35rem)] bg-slate-950 overflow-hidden select-none">
      {/* Full-Bleed 3D WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Atmospheric3DScene
          locationData={currentLocation}
          standard={standard}
          cameraPreset={cameraPreset}
          explodedFactor={explodedFactor}
          showParticles={showParticles}
          showInversionCap={showInversionCap}
          timeOfDay={timeOfDay}
          selectedSensorId={selectedSensorId}
          simulatedAqi={simulatedAqi}
          simulatedWindSpeed={simulatedWindSpeed}
          onSelectSensor={handleSelectSensor}
        />
      </div>

      {/* Top HUD Bar: Telemetry Pill + Camera Presets & Audio Mute */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-2 pointer-events-none">
        {/* Telemetry Pill */}
        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl w-full sm:w-auto sm:min-w-[230px] sm:max-w-sm pointer-events-auto space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight truncate">
                {currentLocation?.city?.split(',')[0] || 'AirIQ Station'}
              </h2>
            </div>
            <span
              className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 border"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}40`,
              }}
            >
              {category.name}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80 gap-3">
            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 block">
                {activeScenario !== 'live' ? 'Simulated AQI' : 'Air Quality Index'}
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-xl sm:text-2xl font-black font-mono tracking-tight"
                  style={{ color: category.color }}
                >
                  {curAqi}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400">AQI</span>
              </div>
            </div>

            <div className="text-right text-[10px] sm:text-[11px] flex sm:block items-center gap-3 sm:space-y-0.5">
              <span className="text-slate-400 block">
                Wind: <strong className="text-slate-200">{simulatedWindSpeed ?? currentLocation?.weather.windSpeed ?? 8} km/h</strong>
              </span>
              <span className="text-slate-400 block">
                PM2.5: <strong className="text-slate-200">{currentLocation?.pollutants.pm25 ?? 'N/A'}</strong>
              </span>
            </div>
          </div>

          {activeScenario !== 'live' && (
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sandbox Mode
              </span>
              <button
                type="button"
                onClick={() => applyScenario('live')}
                className="text-sky-400 hover:underline py-1 px-1.5 min-h-[28px] touch-manipulation"
              >
                Reset to Live
              </button>
            </div>
          )}
        </div>

        {/* Camera Presets & Audio Mute Button */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 pointer-events-auto max-w-full">
          <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-1 text-xs overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedSensorId(null);
                setCameraPreset('hero');
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                cameraPreset === 'hero' && !selectedSensorId
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">Hero </span>Station
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSensorId(null);
                setCameraPreset('dispersion');
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                cameraPreset === 'dispersion'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wind<span className="hidden sm:inline"> Dispersion</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSensorId(null);
                setCameraPreset('inversion');
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                cameraPreset === 'inversion'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">Inversion </span>Cap
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSensorId(null);
                setCameraPreset('panorama');
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                cameraPreset === 'panorama'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">City </span>Panorama
            </button>
          </div>

          {/* Ambient Web Audio Synthesizer Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute procedural wind & telemetry audio' : 'Mute audio'}
            className={`p-2 rounded-xl border transition-colors shadow-xl min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 touch-manipulation ${
              isMuted
                ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
            }`}
            title={isMuted ? 'Unmute procedural wind & telemetry audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Macro Telemetry Card (When an individual sensor is selected) */}
      {activeSensor && (
        <div className="absolute bottom-14 sm:bottom-auto sm:top-36 left-2 right-2 sm:left-4 sm:right-auto z-30 sm:max-w-sm max-h-[48dvh] sm:max-h-[calc(100dvh-21rem)] overflow-y-auto no-scrollbar p-4 rounded-2xl bg-slate-900/95 border border-sky-500/40 shadow-2xl space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold uppercase tracking-wider">
                  {activeSensor.category}
                </span>
                <span className="text-[10px] text-slate-400">Component Macro</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">{activeSensor.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSensorId(null)}
              aria-label="Close sensor details"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-w-[38px] min-h-[38px] flex items-center justify-center touch-manipulation shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{activeSensor.subtitle}</p>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">{activeSensor.primaryMetricName}:</span>
            <strong className="text-xs font-mono text-sky-400 text-right">
              {getSensorReading(activeSensor.id)}
            </strong>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
            {activeSensor.principle}
          </p>

          <div className="space-y-1 border-t border-slate-800 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Engineering Specifications
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
              {activeSensor.techSpecs.map((spec, i) => (
                <div key={i} className="text-slate-400">
                  <span>{spec.label}: </span>
                  <strong className="text-slate-200 font-mono">{spec.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      <div
        className={`absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] sm:w-[94%] max-w-[880px] transition-all duration-300 ease-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-2.5rem)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse Toggle Button */}
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer min-h-[38px] touch-manipulation"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Show Dock Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                <span>Hide Dock Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Body (Solid background without backdrop-filter to prevent WebGL frame drop) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-3 max-h-[38dvh] sm:max-h-[42dvh] lg:max-h-none overflow-y-auto no-scrollbar">
          {/* Tab Selection */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar max-w-full">
              <button
                type="button"
                onClick={() => setActiveDockTab('sensors')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0 min-h-[40px] touch-manipulation ${
                  activeDockTab === 'sensors'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Sensors & Macro</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDockTab('assembly')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0 min-h-[40px] touch-manipulation ${
                  activeDockTab === 'assembly'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Exploded View</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDockTab('simulation')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0 min-h-[40px] touch-manipulation ${
                  activeDockTab === 'simulation'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudFog className="w-3.5 h-3.5" />
                <span>Atmospheric Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDockTab('environment')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0 min-h-[40px] touch-manipulation ${
                  activeDockTab === 'environment'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Sun & City</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setExplodedFactor(0);
                setShowParticles(true);
                setShowInversionCap(true);
                setTimeOfDay(0.5);
                setSelectedSensorId(null);
                applyScenario('live');
                setCameraPreset('hero');
              }}
              aria-label="Reset View Parameters"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 touch-manipulation"
              title="Reset View Parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab 1: Sensors & Interactive Macro Inspection */}
          {activeDockTab === 'sensors' && (
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 block">
                Click any sensor module in the 3D scene or select a sub-system below to zoom in:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(['nephelometer', 'radiometer', 'anemometer', 'gas_analyzer'] as SensorPartId[]).map(
                  (sid) => {
                    const info = STATION_SENSORS[sid];
                    const isSelected = selectedSensorId === sid;
                    return (
                      <button
                        type="button"
                        key={sid}
                        onClick={() => handleSelectSensor(sid)}
                        className={`p-2.5 rounded-xl border text-left transition-all min-h-[44px] touch-manipulation ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                            : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {info.category}
                        </span>
                        <strong className="block text-xs truncate">{info.shortLabel}</strong>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Exploded Assembly Slider */}
          {activeDockTab === 'assembly' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">Structural Kinematic Separation:</span>
                </span>
                <span className="font-mono text-sky-400 font-bold shrink-0">
                  {Math.round(explodedFactor * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 shrink-0">Assembled</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedFactor}
                  onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 shrink-0">Exploded</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Separates the octagonal concrete base, titanium mast, avionics enclosure, nephelometer chamber, radiometer arm, solar wing, and anemometer spire along the Y-axis.
              </p>
            </div>
          )}

          {/* Tab 3: Atmospheric Simulation Sandbox */}
          {activeDockTab === 'simulation' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-[11px] text-slate-400 font-medium shrink-0">Scenarios:</span>
                <button
                  type="button"
                  onClick={() => applyScenario('live')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                    activeScenario === 'live'
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  Live Feed
                </button>
                <button
                  type="button"
                  onClick={() => applyScenario('delhi_inversion')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                    activeScenario === 'delhi_inversion'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  Delhi Inversion (440 AQI)
                </button>
                <button
                  type="button"
                  onClick={() => applyScenario('sea_breeze')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                    activeScenario === 'sea_breeze'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  Clean Sea Breeze (24 AQI)
                </button>
                <button
                  type="button"
                  onClick={() => applyScenario('biomass_smoke')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                    activeScenario === 'biomass_smoke'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  Crop Stubble Smoke (295 AQI)
                </button>
                <button
                  type="button"
                  onClick={() => applyScenario('ozone_peak')}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation ${
                    activeScenario === 'ozone_peak'
                      ? 'bg-orange-500 text-white border-orange-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  Midday Ozone Surge
                </button>
              </div>

              {/* Sliders and Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1.5 border-t border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Manual AQI Override:</span>
                    <strong className="text-sky-400 font-mono">{curAqi} AQI</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={curAqi}
                    onChange={(e) => {
                      setActiveScenario('live');
                      setSimulatedAqi(parseInt(e.target.value));
                    }}
                    className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-center gap-2">
                  <span className="text-[11px] text-slate-300">Inversion Ceiling:</span>
                  <button
                    type="button"
                    onClick={() => setShowInversionCap(!showInversionCap)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[40px] touch-manipulation ${
                      showInversionCap
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {showInversionCap ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="text-[11px] text-slate-300">Particulate Drift:</span>
                  <button
                    type="button"
                    onClick={() => setShowParticles(!showParticles)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[40px] touch-manipulation ${
                      showParticles
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {showParticles ? 'Active' : 'Muted'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Sun Azimuth, Night City & Quick Cities */}
          {activeDockTab === 'environment' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5 shrink-0">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Sun / Moon Orbit:
                    </span>
                    <span className="font-mono text-amber-400 text-[11px] truncate">
                      {timeOfDay < 0.25 || timeOfDay > 0.75
                        ? 'Night (Starfield & City Lights)'
                        : timeOfDay > 0.6
                        ? 'Golden Sunset'
                        : 'Midday Sunlight'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Switch Live Station Location:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    <button
                      type="button"
                      onClick={onUseCurrentLocation}
                      disabled={isLocating}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation"
                    >
                      {isLocating ? 'Locating...' : 'My Location'}
                    </button>
                    {popularCities.map((city) => (
                      <button
                        type="button"
                        key={city}
                        onClick={() => onSelectCity(city)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap shrink-0 transition-colors min-h-[38px] touch-manipulation ${
                          currentLocation?.city.toLowerCase().includes(city.toLowerCase())
                            ? 'bg-sky-500 text-white border-sky-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
