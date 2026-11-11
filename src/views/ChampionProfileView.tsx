import React, { useState } from 'react';
import {
  Award,
  Shield,
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Bike,
  Bus,
  Wind,
  Leaf,
  Zap,
  Eye,
  Plus,
  ThumbsUp,
  MapPin,
  Clock,
  Sparkles,
  Edit3,
  Check,
  TrendingUp,
  FlameKindling,
  Factory,
  HardHat,
  Truck,
  Filter,
} from 'lucide-react';
import { useChampionProfile } from '../lib/useChampionProfile';
import { LocationData, AqiStandard } from '../types/aqi';
import { ChampionBadge, CommunityReport, BadgeTier } from '../types/champion';
import { CommunityReportModal } from '../components/CommunityReportModal';

interface ChampionProfileViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
}

export const ChampionProfileView: React.FC<ChampionProfileViewProps> = ({
  currentLocation,
  standard,
}) => {
  const {
    profile,
    toast,
    dismissToast,
    logHabit,
    submitReport,
    upvoteReport,
    updateProfile,
  } = useChampionProfile();

  const [activeSubTab, setActiveSubTab] = useState<'badges' | 'habits' | 'reports' | 'activity'>('badges');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'reporting' | 'habit'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.displayName);
  const [editNeighborhood, setEditNeighborhood] = useState(profile.neighborhood);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  const availableAvatars = ['🌲', '🚲', '🛡️', '🦅', '⚡', '🌿', '🦁', '🌟'];

  // Icons map
  const renderBadgeIcon = (iconName: string, tier: BadgeTier) => {
    const colorClass =
      tier === 'diamond'
        ? 'text-cyan-400'
        : tier === 'emerald'
        ? 'text-emerald-400'
        : tier === 'gold'
        ? 'text-amber-400'
        : tier === 'silver'
        ? 'text-slate-300'
        : 'text-amber-600';

    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle className={`w-6 h-6 ${colorClass}`} />;
      case 'Eye':
        return <Eye className={`w-6 h-6 ${colorClass}`} />;
      case 'Shield':
        return <Shield className={`w-6 h-6 ${colorClass}`} />;
      case 'Bike':
        return <Bike className={`w-6 h-6 ${colorClass}`} />;
      case 'Bus':
        return <Bus className={`w-6 h-6 ${colorClass}`} />;
      case 'Wind':
        return <Wind className={`w-6 h-6 ${colorClass}`} />;
      case 'Leaf':
        return <Leaf className={`w-6 h-6 ${colorClass}`} />;
      case 'Flame':
        return <Flame className={`w-6 h-6 ${colorClass}`} />;
      case 'FlameKindling':
        return <FlameKindling className={`w-6 h-6 ${colorClass}`} />;
      case 'Trophy':
      default:
        return <Trophy className={`w-6 h-6 ${colorClass}`} />;
    }
  };

  const renderHabitIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bike':
        return <Bike className="w-5 h-5 text-emerald-400" />;
      case 'Bus':
        return <Bus className="w-5 h-5 text-sky-400" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-indigo-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Leaf':
        return <Leaf className="w-5 h-5 text-emerald-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-sky-400" />;
    }
  };

  const renderHazardIcon = (type: CommunityReport['hazardType']) => {
    switch (type) {
      case 'stubble_burning':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'garbage_burning':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'industrial_smoke':
        return <Factory className="w-4 h-4 text-purple-400" />;
      case 'construction_dust':
        return <HardHat className="w-4 h-4 text-amber-400" />;
      case 'heavy_vehicle_idling':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'clean_air_spot':
        return <Leaf className="w-4 h-4 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: editName.trim() || profile.displayName,
      neighborhood: editNeighborhood.trim() || profile.neighborhood,
      avatar: editAvatar,
    });
    setIsEditingProfile(false);
  };

  // Filtered badges
  const filteredBadges = profile.badges.filter((b) => {
    if (badgeFilter === 'unlocked') return b.isUnlocked;
    if (badgeFilter === 'reporting') return b.category === 'reporting';
    if (badgeFilter === 'habit') return b.category === 'habit' || b.category === 'streak';
    return true;
  });

  const unlockedCount = profile.badges.filter((b) => b.isUnlocked).length;
  const currentTierColor =
    profile.rankTier === 'Diamond Champion'
      ? 'from-cyan-400 via-indigo-400 to-fuchsia-400'
      : profile.rankTier === 'Emerald Ambassador'
      ? 'from-emerald-400 to-teal-500'
      : profile.rankTier === 'Gold Sentinel'
      ? 'from-amber-400 to-yellow-500'
      : profile.rankTier === 'Silver Guardian'
      ? 'from-slate-300 to-sky-300'
      : 'from-amber-600 to-orange-500';

  const xpProgressPercent = Math.min(
    100,
    Math.round(((profile.xp % 150) / 150) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 light:bg-white border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-sm text-slate-100 light:text-slate-900">
              {toast.title}
            </h5>
            <p className="text-xs text-slate-300 light:text-slate-600 mt-0.5">
              {toast.subtitle}
            </p>
          </div>
          <button
            onClick={dismissToast}
            aria-label="Dismiss toast"
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 light:from-slate-50 light:to-sky-50 border border-slate-800 light:border-slate-200 p-5 sm:p-8 shadow-xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and Identity */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500/30 to-emerald-500/30 border-2 border-sky-400/50 flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
                {profile.avatar}
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                title="Edit avatar & identity"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md transition-all touch-manipulation"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tracking-tight">
                  {profile.displayName}
                </h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 light:bg-slate-200 text-transparent bg-clip-text bg-gradient-to-r ${currentTierColor}`}>
                  {profile.rankTier}
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>{profile.neighborhood}</span>
                <span className="text-slate-600">·</span>
                <span>Active Resident</span>
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Flame className="w-4 h-4 fill-amber-400/30" />
                  <span>{profile.currentStreak}-Day Streak</span>
                </div>
                <span className="text-slate-600">·</span>
                <div className="flex items-center gap-1 text-slate-400 light:text-slate-500 text-[11px]">
                  <span>Best: {profile.longestStreak} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP & Level Status Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-6 bg-slate-950/60 light:bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 light:border-slate-200">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-xs font-semibold text-slate-400 light:text-slate-500">
                  Level {profile.level}
                </span>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {profile.xp} XP
                </span>
              </div>
              <div className="w-full sm:w-48 h-2.5 bg-slate-800 light:bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                {profile.xpNextLevel - profile.xp} XP needed for Level {profile.level + 1}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all touch-manipulation min-h-[40px]"
              >
                <Plus className="w-4 h-4" /> Report Hazard
              </button>
            </div>
          </div>
        </div>

        {/* Profile Edit Modal / Form Drawer */}
        {isEditingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-5 border-t border-slate-800 light:border-slate-200 animate-in fade-in duration-200 space-y-4"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Customize Citizen Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Neighborhood / Ward</label>
                <input
                  type="text"
                  value={editNeighborhood}
                  onChange={(e) => setEditNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Guardian Avatar</label>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {availableAvatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setEditAvatar(av)}
                      className={`p-1.5 rounded-lg text-lg transition-transform ${
                        editAvatar === av
                          ? 'bg-sky-500/20 border-2 border-sky-400 scale-110'
                          : 'bg-slate-800 light:bg-slate-200 hover:scale-105'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Environmental Impact Telemetry Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500">
              CO₂ Emissions Averted
            </span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {profile.stats.co2AvertedKg} kg
          </div>
          <p className="text-[10px] text-slate-500">
            Equivalent to ~{Math.round(profile.stats.co2AvertedKg * 1.6)} urban tree absorption days
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500">
              PM2.5 Avoided
            </span>
            <Wind className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
            {profile.stats.pm25AvertedGrams} g
          </div>
          <p className="text-[10px] text-slate-500">
            Respirable combustion particulates kept out of air
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500">
              Clean Air Hours Protected
            </span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">
            {profile.stats.cleanAirHoursProtected} hrs
          </div>
          <p className="text-[10px] text-slate-500">
            Cumulative purified indoor and active commute time
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500">
              Badges & Reports
            </span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {unlockedCount} / {profile.badges.length}
          </div>
          <p className="text-[10px] text-slate-500">
            {profile.stats.totalReportsSubmitted} community hazards flagged
          </p>
        </div>
      </div>

      {/* Main Tabbed Interactive Hub */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-start border-b border-slate-800/80 light:border-slate-200 overflow-x-auto no-scrollbar scroll-smooth gap-2 pb-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveSubTab('badges')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation min-h-[40px] shrink-0 whitespace-nowrap active:scale-95 ${
                activeSubTab === 'badges'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-900/40'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Clean Air Badges ({unlockedCount})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('habits')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation min-h-[40px] shrink-0 whitespace-nowrap active:scale-95 ${
                activeSubTab === 'habits'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-900/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Daily Eco-Habits Tracker</span>
            </button>

            <button
              onClick={() => setActiveSubTab('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation min-h-[40px] shrink-0 whitespace-nowrap active:scale-95 ${
                activeSubTab === 'reports'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-900/40'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Community Watch Feed ({profile.communityReports.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('activity')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation min-h-[40px] shrink-0 whitespace-nowrap active:scale-95 ${
                activeSubTab === 'activity'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-900/40'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>XP Activity Log</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BADGES SHOWCASE */}
        {activeSubTab === 'badges' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar scroll-smooth pb-1">
              <span className="text-slate-400 light:text-slate-500 font-medium shrink-0">Filter:</span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/80 light:bg-slate-100 border border-slate-800 light:border-slate-200 shrink-0">
                {(
                  [
                    { id: 'all', label: 'All Honors' },
                    { id: 'unlocked', label: 'Unlocked' },
                    { id: 'reporting', label: 'Citizen Watch' },
                    { id: 'habit', label: 'Habits & Streak' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setBadgeFilter(f.id)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all shrink-0 whitespace-nowrap min-h-[34px] touch-manipulation ${
                      badgeFilter === f.id
                        ? 'bg-slate-800 light:bg-white text-slate-100 light:text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredBadges.map((badge) => {
                const progressPct = Math.min(
                  100,
                  Math.round((badge.currentValue / badge.targetValue) * 100)
                );

                const tierBorder =
                  badge.tier === 'diamond'
                    ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 to-slate-900'
                    : badge.tier === 'emerald'
                    ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-slate-900'
                    : badge.tier === 'gold'
                    ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-slate-900'
                    : badge.tier === 'silver'
                    ? 'border-slate-500/50 bg-slate-900/60'
                    : 'border-orange-800/40 bg-slate-900/60';

                return (
                  <div
                    key={badge.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      badge.isUnlocked
                        ? `${tierBorder} light:bg-white shadow-lg`
                        : 'border-slate-800/60 light:border-slate-200 bg-slate-950/40 light:bg-slate-50/70 opacity-75'
                    }`}
                  >
                    {/* Badge top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-3 rounded-2xl bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-200 shadow-inner">
                        {renderBadgeIcon(badge.iconName, badge.tier)}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700">
                          {badge.tier}
                        </span>
                        <div className="text-[11px] font-bold text-amber-400 mt-1">
                          +{badge.xpReward} XP
                        </div>
                      </div>
                    </div>

                    {/* Title & Desc */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-100 light:text-slate-900">
                          {badge.name}
                        </h4>
                        {badge.isUnlocked && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>

                    {/* Progress Bar & Requirement */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 light:border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 light:text-slate-500">
                          {badge.requirementText}
                        </span>
                        <span className="font-mono font-bold text-slate-200 light:text-slate-800">
                          {badge.isUnlocked
                            ? 'Completed'
                            : `${badge.currentValue} / ${badge.targetValue}`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            badge.isUnlocked
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {badge.isUnlocked && badge.unlockedAt && (
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DAILY HABIT TRACKER */}
        {activeSubTab === 'habits' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/20 light:bg-emerald-50/50 border border-emerald-500/20 light:border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-300 light:text-emerald-800 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4" /> Daily Low-Emission Action Checklist
                </h4>
                <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
                  Log the sustainable choices you made today in {currentLocation?.city || 'your area'}. Each check-in awards Clean Air XP, updates your streak, and calculates avoided air pollution.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 light:bg-white px-3.5 py-2 rounded-xl border border-slate-800 light:border-slate-200 flex-shrink-0">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-100 light:text-slate-900">
                  {profile.dailyHabits.filter((h) => h.completedToday).length} / {profile.dailyHabits.length} Complete
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {profile.dailyHabits.map((habit) => {
                const isDone = habit.completedToday;
                return (
                  <div
                    key={habit.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isDone
                        ? 'bg-emerald-950/10 light:bg-emerald-50/40 border-emerald-500/40'
                        : 'bg-slate-900/60 light:bg-white border-slate-800/80 light:border-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-200 flex-shrink-0">
                        {renderHabitIcon(habit.iconName)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-100 light:text-slate-900">
                            {habit.name}
                          </h4>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            +{habit.xp} XP
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
                          {habit.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 light:text-slate-500">
                          {habit.co2SavingsKg > 0 && (
                            <span className="text-emerald-400">
                              🌱 -{habit.co2SavingsKg} kg CO₂
                            </span>
                          )}
                          {habit.pm25SavingsGrams > 0 && (
                            <span className="text-sky-400">
                              💨 -{habit.pm25SavingsGrams} g PM2.5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 light:border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {isDone ? 'Completed for today' : 'Ready to log'}
                      </span>
                      <button
                        onClick={() => logHabit(habit.id, currentLocation?.city)}
                        disabled={isDone}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] touch-manipulation shrink-0 ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm active:scale-95'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Logged Today
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Check-in Action
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: COMMUNITY CITIZEN REPORTS FEED */}
        {activeSubTab === 'reports' && (
          <div className="space-y-4">
            {/* Header with CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-950/20 light:bg-amber-50/50 border border-amber-500/20 light:border-amber-200">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-300 light:text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Citizen Smoke & Hazard Watch
                </h4>
                <p className="text-xs text-slate-300 light:text-slate-600">
                  Real-time crowdsourced reports from residents detecting trash fires, crop burning, or dust hazards. Confirm neighbor reports to earn +10 validation XP.
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all flex-shrink-0 touch-manipulation min-h-[40px]"
              >
                <Plus className="w-4 h-4" /> File New Hazard
              </button>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              {profile.communityReports.map((rep) => {
                const sevColor =
                  rep.severity === 'Severe'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : rep.severity === 'High'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : rep.severity === 'Clean Oasis'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';

                return (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 space-y-2.5 transition-colors hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-800 light:bg-slate-100 flex-shrink-0">
                          {renderHazardIcon(rep.hazardType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100 light:text-slate-900">
                              {rep.hazardType.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevColor}`}>
                              {rep.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 light:text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-sky-400" />
                            <span>
                              {rep.neighborhood}, {rep.city}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 sm:text-right">
                        <span className="text-[11px] font-mono">
                          {new Date(rep.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-slate-300 font-medium">
                          {rep.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 light:text-slate-700 leading-relaxed pl-1 sm:pl-10">
                      {rep.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 light:border-slate-200 pl-1 sm:pl-10">
                      <span className="text-[11px] text-slate-500">
                        Reported by <strong className="text-slate-300">{rep.reporterName}</strong>
                      </span>
                      <button
                        onClick={() => upvoteReport(rep.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] shrink-0 active:scale-95 ${
                          rep.userUpvoted
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 light:bg-slate-100 light:text-slate-700'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${rep.userUpvoted ? 'fill-sky-400' : ''}`} />
                        <span>Confirm ({rep.upvotes})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY & XP LEDGER */}
        {activeSubTab === 'activity' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-500">
              Clean Air Contributions & XP Ledger
            </h4>
            <div className="divide-y divide-slate-800/60 light:divide-slate-200 bg-slate-900/60 light:bg-white rounded-2xl border border-slate-800/80 light:border-slate-200 overflow-hidden">
              {profile.activityHistory.map((act) => (
                <div key={act.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 light:bg-slate-100 flex-shrink-0 text-sky-400">
                      {act.category === 'badge' ? (
                        <Award className="w-4 h-4 text-amber-400" />
                      ) : act.category === 'report' ? (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Leaf className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-100 light:text-slate-900">
                        {act.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 light:text-slate-500 mt-0.5">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-emerald-400">
                      +{act.xpEarned} XP
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Community Report Modal Dialog */}
      <CommunityReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentLocation={currentLocation}
        onSubmitReport={(data) => {
          submitReport(data);
          setActiveSubTab('reports');
        }}
      />
    </div>
  );
};
