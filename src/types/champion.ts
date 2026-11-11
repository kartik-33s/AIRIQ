export type BadgeCategory = 'reporting' | 'habit' | 'streak' | 'impact';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';
export type ChampionRankTier =
  | 'Bronze Scout'
  | 'Silver Guardian'
  | 'Gold Sentinel'
  | 'Emerald Ambassador'
  | 'Diamond Champion';

export interface ChampionBadge {
  id: string;
  name: string;
  category: BadgeCategory;
  tier: BadgeTier;
  description: string;
  requirementText: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  targetValue: number;
  xpReward: number;
  iconName: string;
}

export type CommunityHazardType =
  | 'stubble_burning'
  | 'garbage_burning'
  | 'industrial_smoke'
  | 'construction_dust'
  | 'heavy_vehicle_idling'
  | 'indoor_unfiltered'
  | 'clean_air_spot';

export interface CommunityReport {
  id: string;
  timestamp: string;
  city: string;
  neighborhood: string;
  hazardType: CommunityHazardType;
  severity: 'Moderate' | 'High' | 'Severe' | 'Clean Oasis';
  description: string;
  coordinates?: { lat: number; lng: number };
  upvotes: number;
  userUpvoted?: boolean;
  status: 'Verified' | 'Community Review' | 'Action Requested';
  reporterName: string;
  xpEarned: number;
}

export interface DailyHabit {
  id: string;
  name: string;
  category: 'transit' | 'indoor' | 'lifestyle' | 'advocacy';
  description: string;
  xp: number;
  co2SavingsKg: number;
  pm25SavingsGrams: number;
  completedToday: boolean;
  iconName: string;
}

export interface ChampionActivity {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  xpEarned: number;
  category: 'report' | 'habit' | 'badge' | 'upvote';
}

export interface ChampionProfile {
  userId: string;
  displayName: string;
  neighborhood: string;
  avatar: string;
  level: number;
  rankTier: ChampionRankTier;
  xp: number;
  xpNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  stats: {
    totalReportsSubmitted: number;
    verifiedReportsCount: number;
    habitsLoggedCount: number;
    co2AvertedKg: number;
    pm25AvertedGrams: number;
    cleanAirHoursProtected: number;
  };
  badges: ChampionBadge[];
  dailyHabits: DailyHabit[];
  activityHistory: ChampionActivity[];
  communityReports: CommunityReport[];
}
