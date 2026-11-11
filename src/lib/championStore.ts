import {
  ChampionProfile,
  ChampionBadge,
  DailyHabit,
  CommunityReport,
  ChampionActivity,
  ChampionRankTier,
} from '../types/champion';

const STORAGE_KEY = 'airiq_champion_profile_v2';

const INITIAL_BADGES: ChampionBadge[] = [
  {
    id: 'first_watch',
    name: 'First Watch',
    category: 'reporting',
    tier: 'bronze',
    description: 'Submitted your first community air pollution hazard report.',
    requirementText: 'Submit 1 community report',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 1,
    xpReward: 50,
    iconName: 'AlertTriangle',
  },
  {
    id: 'smog_spotter',
    name: 'Smog Spotter',
    category: 'reporting',
    tier: 'silver',
    description: 'Vigilant watchdog with 3 verified local pollution hazard reports.',
    requirementText: 'Submit 3 community reports',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 3,
    xpReward: 150,
    iconName: 'Eye',
  },
  {
    id: 'neighborhood_sentinel',
    name: 'Neighborhood Sentinel',
    category: 'reporting',
    tier: 'gold',
    description: 'Active guardian: submitted 5 reports and validated neighbor alerts.',
    requirementText: 'Submit 5 reports & upvote 3 community alerts',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 5,
    xpReward: 300,
    iconName: 'Shield',
  },
  {
    id: 'pedal_stride',
    name: 'Pedal & Stride',
    category: 'habit',
    tier: 'bronze',
    description: 'Chose zero-emission active transit (walking or cycling) 3 times.',
    requirementText: 'Log 3 active walking / cycling commutes',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 3,
    xpReward: 60,
    iconName: 'Bike',
  },
  {
    id: 'transit_pioneer',
    name: 'Transit Pioneer',
    category: 'habit',
    tier: 'silver',
    description: 'Logged 5 public transit or electrified shared rides.',
    requirementText: 'Log 5 public transit or EV rides',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 5,
    xpReward: 120,
    iconName: 'Bus',
  },
  {
    id: 'hepa_guardian',
    name: 'Clean Air Sanctuary',
    category: 'habit',
    tier: 'silver',
    description: 'Purified indoor microclimate by running certified HEPA air filters.',
    requirementText: 'Log 4 indoor HEPA air filtration sessions',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 4,
    xpReward: 100,
    iconName: 'Wind',
  },
  {
    id: 'carbon_neutralizer',
    name: 'Carbon Neutralizer',
    category: 'impact',
    tier: 'gold',
    description: 'Averted over 20 kg of carbon emissions through sustainable choices.',
    requirementText: 'Avert 20+ kg CO₂ via habit check-ins',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 20,
    xpReward: 250,
    iconName: 'Leaf',
  },
  {
    id: 'streak_master',
    name: '7-Day Eco Sentinel',
    category: 'streak',
    tier: 'emerald',
    description: 'Maintained a persistent 7-day clean air habit logging streak.',
    requirementText: 'Achieve a 7-day active streak',
    isUnlocked: false,
    currentValue: 1,
    targetValue: 7,
    xpReward: 200,
    iconName: 'Flame',
  },
  {
    id: 'smoke_buster',
    name: 'Smoke Buster',
    category: 'reporting',
    tier: 'silver',
    description: 'Reported agricultural stubble burning or open waste incineration.',
    requirementText: 'Report 1 open fire or stubble burning incident',
    isUnlocked: false,
    currentValue: 0,
    targetValue: 1,
    xpReward: 100,
    iconName: 'FlameKindling',
  },
  {
    id: 'clean_air_champion',
    name: 'Clean Air Champion',
    category: 'impact',
    tier: 'diamond',
    description: 'Distinguished environmental champion: reached Level 5 and 600+ XP.',
    requirementText: 'Reach Level 5 and 600 total XP',
    isUnlocked: false,
    currentValue: 120,
    targetValue: 600,
    xpReward: 500,
    iconName: 'Trophy',
  },
];

const DEFAULT_HABITS: DailyHabit[] = [
  {
    id: 'habit_active',
    name: 'Walked or Cycled for Commute',
    category: 'transit',
    description: 'Zero tailpipe emissions and zero particulate generation.',
    xp: 35,
    co2SavingsKg: 3.2,
    pm25SavingsGrams: 4.8,
    completedToday: false,
    iconName: 'Bike',
  },
  {
    id: 'habit_transit',
    name: 'Took Metro / Public Bus',
    category: 'transit',
    description: 'Shared high-capacity transit reduces per-capita smog footprint.',
    xp: 25,
    co2SavingsKg: 2.6,
    pm25SavingsGrams: 3.5,
    completedToday: false,
    iconName: 'Bus',
  },
  {
    id: 'habit_hepa',
    name: 'Ran HEPA Air Purifier Indoors',
    category: 'indoor',
    description: 'Shielded household lungs and lowered indoor particulate load.',
    xp: 15,
    co2SavingsKg: 0.1,
    pm25SavingsGrams: 1.2,
    completedToday: false,
    iconName: 'Wind',
  },
  {
    id: 'habit_idling',
    name: 'Cut Engine Idling at Stops',
    category: 'lifestyle',
    description: 'Shut off engine during stationary traffic and railway crossings.',
    xp: 20,
    co2SavingsKg: 1.1,
    pm25SavingsGrams: 1.8,
    completedToday: false,
    iconName: 'Zap',
  },
  {
    id: 'habit_plants',
    name: 'Nurtured Urban Plants / Trees',
    category: 'lifestyle',
    description: 'Foliage and leaves trap particulate matter from surrounding air.',
    xp: 20,
    co2SavingsKg: 0.5,
    pm25SavingsGrams: 0.8,
    completedToday: false,
    iconName: 'Leaf',
  },
];

const INITIAL_COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: 'rep-01',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    city: 'Kharar',
    neighborhood: 'Sunny Enclave, Sector 125',
    hazardType: 'garbage_burning',
    severity: 'High',
    description: 'Open waste burning observed near vacant plot boundary, thick acrid smoke drifting northwards.',
    coordinates: { lat: 30.749, lng: 76.643 },
    upvotes: 8,
    userUpvoted: false,
    status: 'Verified',
    reporterName: 'Resident #1042',
    xpEarned: 50,
  },
  {
    id: 'rep-02',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    city: 'Kharar',
    neighborhood: 'Kharar-Landran Highway',
    hazardType: 'construction_dust',
    severity: 'Moderate',
    description: 'Uncovered aggregate gravel dumping without water spray misting, causing visible dust curtain.',
    coordinates: { lat: 30.732, lng: 76.655 },
    upvotes: 5,
    userUpvoted: true,
    status: 'Action Requested',
    reporterName: 'EcoWarden_PB',
    xpEarned: 50,
  },
  {
    id: 'rep-03',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    city: 'Kharar',
    neighborhood: 'Majatri Agricultural Belt',
    hazardType: 'stubble_burning',
    severity: 'Severe',
    description: 'Post-harvest crop stubble field smoke plumes visible along the south-western wind corridor.',
    coordinates: { lat: 30.718, lng: 76.621 },
    upvotes: 14,
    userUpvoted: false,
    status: 'Verified',
    reporterName: 'PunjabAirWatch',
    xpEarned: 60,
  },
  {
    id: 'rep-04',
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    city: 'Kharar',
    neighborhood: 'Town Park & Lakefront',
    hazardType: 'clean_air_spot',
    severity: 'Clean Oasis',
    description: 'Dense eucalyptus and neem canopy with refreshing breeze. AQI noticeably cleaner here today.',
    coordinates: { lat: 30.741, lng: 76.649 },
    upvotes: 19,
    userUpvoted: true,
    status: 'Verified',
    reporterName: 'GreenRunner',
    xpEarned: 30,
  },
];

export function calculateLevelAndTier(xp: number): {
  level: number;
  rankTier: ChampionRankTier;
  xpNextLevel: number;
} {
  const level = Math.max(1, Math.floor(xp / 150) + 1);
  const xpNextLevel = level * 150;

  let rankTier: ChampionRankTier = 'Bronze Scout';
  if (level >= 8) rankTier = 'Diamond Champion';
  else if (level >= 6) rankTier = 'Emerald Ambassador';
  else if (level >= 4) rankTier = 'Gold Sentinel';
  else if (level >= 2) rankTier = 'Silver Guardian';

  return { level, rankTier, xpNextLevel };
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultProfile(): ChampionProfile {
  const today = getTodayString();
  const initialXp = 125;
  const { level, rankTier, xpNextLevel } = calculateLevelAndTier(initialXp);

  return {
    userId: 'user_' + Math.random().toString(36).substring(2, 9),
    displayName: 'Clean Air Guardian',
    neighborhood: 'Kharar Urban Ward',
    avatar: '🌲',
    level,
    rankTier,
    xp: initialXp,
    xpNextLevel,
    currentStreak: 2,
    longestStreak: 4,
    lastActiveDate: today,
    stats: {
      totalReportsSubmitted: 1,
      verifiedReportsCount: 1,
      habitsLoggedCount: 4,
      co2AvertedKg: 12.4,
      pm25AvertedGrams: 18.2,
      cleanAirHoursProtected: 28,
    },
    badges: INITIAL_BADGES.map((b) => {
      if (b.id === 'first_watch') {
        return {
          ...b,
          isUnlocked: true,
          unlockedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          currentValue: 1,
        };
      }
      if (b.id === 'pedal_stride') {
        return { ...b, currentValue: 1 };
      }
      if (b.id === 'transit_pioneer') {
        return { ...b, currentValue: 2 };
      }
      if (b.id === 'streak_master') {
        return { ...b, currentValue: 2 };
      }
      if (b.id === 'carbon_neutralizer') {
        return { ...b, currentValue: 12.4 };
      }
      if (b.id === 'clean_air_champion') {
        return { ...b, currentValue: initialXp };
      }
      return b;
    }),
    dailyHabits: DEFAULT_HABITS,
    activityHistory: [
      {
        id: 'act-01',
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        title: 'Logged Active Commute',
        detail: 'Cycled instead of driving, averting 3.2 kg CO₂',
        xpEarned: 35,
        category: 'habit',
      },
      {
        id: 'act-02',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        title: 'Reported Smoke Incident',
        detail: 'Logged waste burning alert in Sector 125',
        xpEarned: 50,
        category: 'report',
      },
      {
        id: 'act-03',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        title: 'Unlocked "First Watch" Badge',
        detail: 'Awarded Bronze Scout honors for community vigilance',
        xpEarned: 50,
        category: 'badge',
      },
    ],
    communityReports: INITIAL_COMMUNITY_REPORTS,
  };
}

let memoryProfileCache: ChampionProfile | null = null;

export function loadChampionProfile(): ChampionProfile {
  try {
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(STORAGE_KEY);
    } else if (memoryProfileCache) {
      return memoryProfileCache;
    }

    if (!raw) {
      const def = createDefaultProfile();
      saveChampionProfile(def);
      return def;
    }
    const profile: ChampionProfile = JSON.parse(raw);

    // Check if new day to reset habits
    const today = getTodayString();
    if (profile.lastActiveDate !== today) {
      // Check streak continuity: yesterday?
      const lastDate = new Date(profile.lastActiveDate);
      const currDate = new Date(today);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      let newStreak = profile.currentStreak;
      if (diffDays === 1) {
        // yesterday, streak preserved
      } else if (diffDays > 1) {
        // missed day, reset streak to 1
        newStreak = 1;
      }

      // reset daily habits checklist for the new day
      const resetHabits = profile.dailyHabits.map((h) => ({ ...h, completedToday: false }));
      const updated: ChampionProfile = {
        ...profile,
        currentStreak: newStreak,
        dailyHabits: resetHabits,
        lastActiveDate: today,
      };
      saveChampionProfile(updated);
      return updated;
    }

    return profile;
  } catch {
    return memoryProfileCache || createDefaultProfile();
  }
}

export function saveChampionProfile(profile: ChampionProfile): void {
  try {
    memoryProfileCache = profile;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('airiq_champion_update', { detail: profile }));
    }
  } catch {
    // In-memory cache is already set
  }
}

function evaluateBadges(
  badges: ChampionBadge[],
  stats: ChampionProfile['stats'],
  streak: number,
  xp: number,
  reports: CommunityReport[]
): { updatedBadges: ChampionBadge[]; newlyUnlocked: ChampionBadge[] } {
  const newlyUnlocked: ChampionBadge[] = [];

  const updatedBadges = badges.map((badge) => {
    let currentValue = badge.currentValue;

    switch (badge.id) {
      case 'first_watch':
        currentValue = stats.totalReportsSubmitted;
        break;
      case 'smog_spotter':
        currentValue = stats.totalReportsSubmitted;
        break;
      case 'neighborhood_sentinel':
        currentValue = stats.totalReportsSubmitted;
        break;
      case 'pedal_stride':
      case 'transit_pioneer':
      case 'hepa_guardian':
        // tracked via current value accumulation
        break;
      case 'carbon_neutralizer':
        currentValue = Math.round(stats.co2AvertedKg * 10) / 10;
        break;
      case 'streak_master':
        currentValue = streak;
        break;
      case 'smoke_buster':
        const smokeReports = reports.filter(
          (r) => r.hazardType === 'stubble_burning' || r.hazardType === 'garbage_burning'
        ).length;
        currentValue = smokeReports;
        break;
      case 'clean_air_champion':
        currentValue = xp;
        break;
    }

    const shouldUnlock = !badge.isUnlocked && currentValue >= badge.targetValue;

    if (shouldUnlock) {
      const unlockedBadge: ChampionBadge = {
        ...badge,
        currentValue,
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(unlockedBadge);
      return unlockedBadge;
    }

    return {
      ...badge,
      currentValue,
    };
  });

  return { updatedBadges, newlyUnlocked };
}

export function logHabitAction(
  habitId: string,
  userCity: string = 'Local Area'
): {
  profile: ChampionProfile;
  xpEarned: number;
  newlyUnlocked: ChampionBadge[];
} {
  const current = loadChampionProfile();
  const today = getTodayString();

  const habit = current.dailyHabits.find((h) => h.id === habitId);
  if (!habit) return { profile: current, xpEarned: 0, newlyUnlocked: [] };

  // If already completed today, we still allow logging additional effort
  const xpEarned = habit.xp;
  const newXp = current.xp + xpEarned;
  const { level, rankTier, xpNextLevel } = calculateLevelAndTier(newXp);

  // Update stats
  const newCo2 = Math.round((current.stats.co2AvertedKg + habit.co2SavingsKg) * 10) / 10;
  const newPm25 = Math.round((current.stats.pm25AvertedGrams + habit.pm25SavingsGrams) * 10) / 10;
  const newHabitsCount = current.stats.habitsLoggedCount + 1;

  // Streak logic
  let newStreak = current.currentStreak;
  let newLongest = current.longestStreak;
  if (current.lastActiveDate !== today) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
  }

  // Update daily habit state
  const updatedHabits = current.dailyHabits.map((h) =>
    h.id === habitId ? { ...h, completedToday: true } : h
  );

  // Progress specific badge counters
  let updatedBadges = current.badges.map((b) => {
    if (
      (habitId === 'habit_active' && b.id === 'pedal_stride') ||
      (habitId === 'habit_transit' && b.id === 'transit_pioneer') ||
      (habitId === 'habit_hepa' && b.id === 'hepa_guardian')
    ) {
      return { ...b, currentValue: b.currentValue + 1 };
    }
    return b;
  });

  const updatedStats = {
    ...current.stats,
    habitsLoggedCount: newHabitsCount,
    co2AvertedKg: newCo2,
    pm25AvertedGrams: newPm25,
    cleanAirHoursProtected: current.stats.cleanAirHoursProtected + 2,
  };

  // Evaluate badge unlocks
  const evalResult = evaluateBadges(
    updatedBadges,
    updatedStats,
    newStreak,
    newXp,
    current.communityReports
  );
  updatedBadges = evalResult.updatedBadges;

  // Additional XP from unlocked badges
  let totalXp = newXp;
  evalResult.newlyUnlocked.forEach((b) => {
    totalXp += b.xpReward;
  });
  const finalProg = calculateLevelAndTier(totalXp);

  const newActivity: ChampionActivity = {
    id: 'act-' + Date.now(),
    timestamp: new Date().toISOString(),
    title: `Logged: ${habit.name}`,
    detail: `Saved ${habit.co2SavingsKg} kg CO₂ · ${habit.pm25SavingsGrams} g PM2.5 in ${userCity}`,
    xpEarned,
    category: 'habit',
  };

  const badgeActivities: ChampionActivity[] = evalResult.newlyUnlocked.map((b) => ({
    id: 'badge-' + b.id + '-' + Date.now(),
    timestamp: new Date().toISOString(),
    title: `Badge Unlocked: ${b.name}!`,
    detail: `${b.description} (+${b.xpReward} XP)`,
    xpEarned: b.xpReward,
    category: 'badge',
  }));

  const nextProfile: ChampionProfile = {
    ...current,
    xp: totalXp,
    level: finalProg.level,
    rankTier: finalProg.rankTier,
    xpNextLevel: finalProg.xpNextLevel,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    stats: updatedStats,
    badges: updatedBadges,
    dailyHabits: updatedHabits,
    activityHistory: [newActivity, ...badgeActivities, ...current.activityHistory].slice(0, 50),
  };

  saveChampionProfile(nextProfile);
  return {
    profile: nextProfile,
    xpEarned,
    newlyUnlocked: evalResult.newlyUnlocked,
  };
}

export function submitCommunityIncidentReport(reportInput: {
  city: string;
  neighborhood: string;
  hazardType: CommunityReport['hazardType'];
  severity: CommunityReport['severity'];
  description: string;
  coordinates?: { lat: number; lng: number };
}): {
  profile: ChampionProfile;
  xpEarned: number;
  newReport: CommunityReport;
  newlyUnlocked: ChampionBadge[];
} {
  const current = loadChampionProfile();
  const today = getTodayString();

  const xpEarned = reportInput.hazardType === 'stubble_burning' ? 60 : 50;
  const newXp = current.xp + xpEarned;
  const { level, rankTier, xpNextLevel } = calculateLevelAndTier(newXp);

  const newReport: CommunityReport = {
    id: 'rep-' + Date.now(),
    timestamp: new Date().toISOString(),
    city: reportInput.city || current.neighborhood || 'Local Area',
    neighborhood: reportInput.neighborhood || 'Community Zone',
    hazardType: reportInput.hazardType,
    severity: reportInput.severity,
    description: reportInput.description,
    coordinates: reportInput.coordinates,
    upvotes: 1,
    userUpvoted: true,
    status: 'Verified',
    reporterName: current.displayName,
    xpEarned,
  };

  const updatedReports = [newReport, ...current.communityReports];
  const updatedStats = {
    ...current.stats,
    totalReportsSubmitted: current.stats.totalReportsSubmitted + 1,
    verifiedReportsCount: current.stats.verifiedReportsCount + 1,
  };

  let newStreak = current.currentStreak;
  let newLongest = current.longestStreak;
  if (current.lastActiveDate !== today) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
  }

  // Evaluate badge unlocks
  const evalResult = evaluateBadges(
    current.badges,
    updatedStats,
    newStreak,
    newXp,
    updatedReports
  );

  let totalXp = newXp;
  evalResult.newlyUnlocked.forEach((b) => {
    totalXp += b.xpReward;
  });
  const finalProg = calculateLevelAndTier(totalXp);

  const newActivity: ChampionActivity = {
    id: 'act-' + Date.now(),
    timestamp: new Date().toISOString(),
    title: `Filed Hazard Report: ${reportInput.hazardType.replace('_', ' ')}`,
    detail: `${reportInput.neighborhood}, ${reportInput.city} · Severity: ${reportInput.severity}`,
    xpEarned,
    category: 'report',
  };

  const badgeActivities: ChampionActivity[] = evalResult.newlyUnlocked.map((b) => ({
    id: 'badge-' + b.id + '-' + Date.now(),
    timestamp: new Date().toISOString(),
    title: `Badge Unlocked: ${b.name}!`,
    detail: `${b.description} (+${b.xpReward} XP)`,
    xpEarned: b.xpReward,
    category: 'badge',
  }));

  const nextProfile: ChampionProfile = {
    ...current,
    xp: totalXp,
    level: finalProg.level,
    rankTier: finalProg.rankTier,
    xpNextLevel: finalProg.xpNextLevel,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    stats: updatedStats,
    badges: evalResult.updatedBadges,
    communityReports: updatedReports,
    activityHistory: [newActivity, ...badgeActivities, ...current.activityHistory].slice(0, 50),
  };

  saveChampionProfile(nextProfile);
  return {
    profile: nextProfile,
    xpEarned,
    newReport,
    newlyUnlocked: evalResult.newlyUnlocked,
  };
}

export function upvoteCommunityReport(reportId: string): ChampionProfile {
  const current = loadChampionProfile();
  let xpEarned = 0;

  const updatedReports = current.communityReports.map((r) => {
    if (r.id === reportId) {
      const wasUpvoted = r.userUpvoted;
      const countDiff = wasUpvoted ? -1 : 1;
      if (!wasUpvoted) xpEarned = 10; // Community validator bonus
      return {
        ...r,
        upvotes: Math.max(0, r.upvotes + countDiff),
        userUpvoted: !wasUpvoted,
      };
    }
    return r;
  });

  const newXp = current.xp + xpEarned;
  const { level, rankTier, xpNextLevel } = calculateLevelAndTier(newXp);

  const newActivity: ChampionActivity | null =
    xpEarned > 0
      ? {
          id: 'act-' + Date.now(),
          timestamp: new Date().toISOString(),
          title: 'Validated Citizen Report',
          detail: 'Confirmed neighborhood air quality hazard (+10 XP)',
          xpEarned: 10,
          category: 'upvote',
        }
      : null;

  const nextProfile: ChampionProfile = {
    ...current,
    xp: newXp,
    level,
    rankTier,
    xpNextLevel,
    communityReports: updatedReports,
    activityHistory: newActivity
      ? [newActivity, ...current.activityHistory].slice(0, 50)
      : current.activityHistory,
  };

  saveChampionProfile(nextProfile);
  return nextProfile;
}

export function updateChampionProfile(
  updates: Partial<Pick<ChampionProfile, 'displayName' | 'neighborhood' | 'avatar'>>
): ChampionProfile {
  const current = loadChampionProfile();
  const nextProfile: ChampionProfile = {
    ...current,
    ...updates,
  };
  saveChampionProfile(nextProfile);
  return nextProfile;
}
