import React from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Play,
  Square,
  Sparkles,
  TreePine,
  Wind,
  Factory,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { useAmbientSoundscape } from '../lib/useAmbientSoundscape';
import { SoundscapePreset } from '../lib/ambientSoundscape';
import { LocationData } from '../types/aqi';

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationData | null;
}

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
}) => {
  const {
    state,
    isPlaying,
    volume,
    preset,
    activeProfileName,
    activeProfileDescription,
    toggle,
    setVolume,
    setPreset,
  } = useAmbientSoundscape(currentLocation?.aqi);

  if (!isOpen) return null;

  const presets: {
    id: SoundscapePreset;
    label: string;
    icon: React.FC<{ className?: string }>;
    tag: string;
  }[] = [
    {
      id: 'auto',
      label: 'Auto (AQI Synced)',
      icon: Radio,
      tag: `Syncs to ${currentLocation?.city || 'Local'} (${currentLocation?.aqi ?? 45} AQI)`,
    },
    {
      id: 'forest',
      label: 'Forest & Songbirds',
      icon: TreePine,
      tag: 'Simulates Good Air (< 50 AQI)',
    },
    {
      id: 'meadow',
      label: 'Meadow Breeze',
      icon: Wind,
      tag: 'Simulates Moderate Air (51–100 AQI)',
    },
    {
      id: 'haze',
      label: 'Suburban Haze',
      icon: Sliders,
      tag: 'Simulates Elevated Smog (101–175 AQI)',
    },
    {
      id: 'industrial',
      label: 'Industrial Drone',
      icon: Factory,
      tag: 'Simulates Severe Inversion (175+ AQI)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-2xl p-4 sm:p-6 my-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isPlaying
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400'
              }`}
            >
              {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 light:text-slate-900 text-base sm:text-lg">
                Atmospheric Soundscape
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Procedural nature audio generated from live AQI telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close ambient sound settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 light:hover:text-slate-900 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
          {/* Main Status & Play/Pause Hero */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isPlaying
                ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-sky-950/30 light:from-emerald-50 light:to-sky-50 border-emerald-500/40 light:border-emerald-200'
                : 'bg-slate-800/40 light:bg-slate-50 border-slate-800 light:border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400 light:text-emerald-700">
                  {isPlaying ? 'Live Ambient Synthesis Active' : 'Soundscape Muted'}
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-100 light:text-slate-900 mt-0.5">
                  {activeProfileName}
                </h4>
              </div>

              <button
                onClick={toggle}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 touch-manipulation min-h-[40px] ${
                  isPlaying
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop Audio
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Play Soundscape
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-300 light:text-slate-600 mt-2.5 leading-relaxed">
              {activeProfileDescription}
            </p>

            {/* Equalizer animation bars */}
            {isPlaying && (
              <div className="mt-3 pt-3 border-t border-slate-800/60 light:border-slate-200/60 flex items-center gap-1 h-5">
                {[12, 20, 8, 24, 16, 28, 14, 22, 10, 18, 26, 12, 19, 14, 25, 17, 21].map(
                  (h, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-sky-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}px`,
                        animationDelay: `${(idx * 70) % 600}ms`,
                        animationDuration: `${700 + ((idx * 110) % 500)}ms`,
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {/* Soundscape Presets Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700">
              Sound Profile Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p) => {
                const Icon = p.icon;
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all touch-manipulation min-h-[44px] ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 light:text-sky-900 shadow-sm'
                        : 'bg-slate-800/40 light:bg-slate-50 border-slate-700/60 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 light:bg-white text-sky-400 flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 light:text-slate-500 line-clamp-1">
                        {p.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 light:text-slate-700">
                Master Volume
              </span>
              <span className="font-mono text-slate-400">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <Volume2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </div>
          </div>

          {/* Procedural synthesis explanation note */}
          <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 text-[11px] text-slate-400 light:text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 light:text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>How It Works</span>
            </div>
            <p className="leading-relaxed">
              When ambient air quality is clean (AQI &le; 50), the system generates forest canopy pink-noise wind, woodland stream frequencies, and intermittent birdsong. As AQI rises into unhealthy levels (&gt; 150), natural high frequencies fade and a 55Hz low-frequency industrial inversion hum emerges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
