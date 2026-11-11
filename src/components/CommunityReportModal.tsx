import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Factory,
  HardHat,
  Truck,
  Leaf,
  MapPin,
  Send,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CommunityHazardType, CommunityReport } from '../types/champion';
import { LocationData } from '../types/aqi';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationData | null;
  onSubmitReport: (data: {
    city: string;
    neighborhood: string;
    hazardType: CommunityHazardType;
    severity: CommunityReport['severity'];
    description: string;
    coordinates?: { lat: number; lng: number };
  }) => void;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSubmitReport,
}) => {
  const [hazardType, setHazardType] = useState<CommunityHazardType>('garbage_burning');
  const [severity, setSeverity] = useState<CommunityReport['severity']>('High');
  const [neighborhood, setNeighborhood] = useState(
    currentLocation?.stationName || 'Central Ward'
  );
  const [city, setCity] = useState(currentLocation?.city || 'Local Area');
  const [description, setDescription] = useState('');
  const [includeGps, setIncludeGps] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const hazardOptions: {
    id: CommunityHazardType;
    title: string;
    icon: React.FC<{ className?: string }>;
    desc: string;
  }[] = [
    {
      id: 'stubble_burning',
      title: 'Stubble / Crop Fire',
      icon: Flame,
      desc: 'Agricultural field residue smoke or open field fires.',
    },
    {
      id: 'garbage_burning',
      title: 'Waste Incineration',
      icon: AlertTriangle,
      desc: 'Plastic, leaves, or municipal waste burning in open bins/plots.',
    },
    {
      id: 'industrial_smoke',
      title: 'Factory Smoke Plume',
      icon: Factory,
      desc: 'Excessive industrial chimney plume or black smokestack discharge.',
    },
    {
      id: 'construction_dust',
      title: 'Construction Dust',
      icon: HardHat,
      desc: 'Unmisted excavation, cement dust, or uncovered aggregate transit.',
    },
    {
      id: 'heavy_vehicle_idling',
      title: 'Heavy Vehicle Idling',
      icon: Truck,
      desc: 'Prolonged diesel truck or bus idling at depots or crossings.',
    },
    {
      id: 'clean_air_spot',
      title: 'Clean Air Sanctuary',
      icon: Leaf,
      desc: 'City park, green canopy, or HEPA-filtered public oasis.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmitReport({
      city,
      neighborhood,
      hazardType,
      severity,
      description: description.trim(),
      coordinates:
        includeGps && currentLocation?.coordinates ? currentLocation.coordinates : undefined,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setDescription('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-2xl p-4 sm:p-6 my-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 light:text-slate-900 text-base sm:text-lg">
                Report Air Pollution Incident
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Community alert system · Earn up to 60 Clean Air Champion XP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 light:hover:text-slate-900 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        {isSubmitted ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-100 light:text-slate-900">
              Citizen Report Broadcasted!
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-600 max-w-xs">
              Your report has been logged to the community ledger. XP and badge progress have been credited to your profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-2">
                Hazard Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hazardOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = hazardType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setHazardType(opt.id);
                        if (opt.id === 'clean_air_spot') setSeverity('Clean Oasis');
                        else if (severity === 'Clean Oasis') setSeverity('High');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all touch-manipulation min-h-[44px] ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 light:text-amber-800'
                          : 'bg-slate-800/40 light:bg-slate-50 border-slate-700/60 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-bold truncate">{opt.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 light:text-slate-500 line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Level */}
            {hazardType !== 'clean_air_spot' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                  Severity Assessment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Moderate', 'High', 'Severe'] as const).map((sev) => {
                    const isSelected = severity === sev;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all min-h-[40px] touch-manipulation ${
                          isSelected
                            ? sev === 'Severe'
                              ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                              : sev === 'High'
                              ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                              : 'bg-yellow-500/20 border-yellow-500/60 text-yellow-400'
                            : 'bg-slate-800/40 light:bg-slate-50 border-slate-700/60 light:border-slate-200 text-slate-400'
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  City / Area
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Kharar, Mohali"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/60 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Neighborhood / Landmark
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                  placeholder="e.g. Sector 125, Kharar-Landran Road"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/60 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Description & Observations
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Describe what you see or smell: smoke intensity, wind drift direction, estimated duration..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800/60 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500 resize-none placeholder:text-slate-500"
              />
            </div>

            {/* GPS inclusion toggle */}
            {currentLocation?.coordinates && (
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-800/30 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <input
                  type="checkbox"
                  checked={includeGps}
                  onChange={(e) => setIncludeGps(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 focus:outline-none"
                />
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs text-slate-300 light:text-slate-700">
                  Pin verified coordinates ({currentLocation.coordinates.lat.toFixed(3)},{' '}
                  {currentLocation.coordinates.lng.toFixed(3)})
                </span>
              </label>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">+50–60 Clean Air XP</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!description.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 min-h-[40px] touch-manipulation"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Report
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
