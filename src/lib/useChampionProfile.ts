import { useState, useEffect, useCallback } from 'react';
import { ChampionProfile, ChampionBadge, CommunityReport } from '../types/champion';
import {
  loadChampionProfile,
  logHabitAction,
  submitCommunityIncidentReport,
  upvoteCommunityReport,
  updateChampionProfile,
} from './championStore';

export interface ChampionToastNotification {
  id: string;
  type: 'xp' | 'badge';
  title: string;
  subtitle: string;
  icon?: string;
  xp?: number;
}

export function useChampionProfile() {
  const [profile, setProfile] = useState<ChampionProfile>(() => loadChampionProfile());
  const [toast, setToast] = useState<ChampionToastNotification | null>(null);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ChampionProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(loadChampionProfile());
      }
    };

    window.addEventListener('airiq_champion_update', handleUpdate);
    return () => window.removeEventListener('airiq_champion_update', handleUpdate);
  }, []);

  const showToast = useCallback((toastData: Omit<ChampionToastNotification, 'id'>) => {
    const id = 'toast-' + Date.now();
    setToast({ ...toastData, id });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  }, []);

  const logHabit = useCallback(
    (habitId: string, city?: string) => {
      const result = logHabitAction(habitId, city);
      setProfile(result.profile);

      if (result.newlyUnlocked.length > 0) {
        const badge = result.newlyUnlocked[0];
        showToast({
          type: 'badge',
          title: `🏆 Badge Unlocked: ${badge.name}!`,
          subtitle: `${badge.description} (+${badge.xpReward} XP)`,
          xp: badge.xpReward,
        });
      } else {
        showToast({
          type: 'xp',
          title: `+${result.xpEarned} Clean Air XP`,
          subtitle: 'Habit logged · Reducing carbon & particulate footprint',
          xp: result.xpEarned,
        });
      }
      return result;
    },
    [showToast]
  );

  const submitReport = useCallback(
    (reportData: {
      city: string;
      neighborhood: string;
      hazardType: CommunityReport['hazardType'];
      severity: CommunityReport['severity'];
      description: string;
      coordinates?: { lat: number; lng: number };
    }) => {
      const result = submitCommunityIncidentReport(reportData);
      setProfile(result.profile);

      if (result.newlyUnlocked.length > 0) {
        const badge = result.newlyUnlocked[0];
        showToast({
          type: 'badge',
          title: `🏆 Badge Unlocked: ${badge.name}!`,
          subtitle: `${badge.description} (+${badge.xpReward} XP)`,
          xp: badge.xpReward,
        });
      } else {
        showToast({
          type: 'xp',
          title: `+${result.xpEarned} Clean Air XP`,
          subtitle: 'Citizen pollution report verified & published',
          xp: result.xpEarned,
        });
      }
      return result;
    },
    [showToast]
  );

  const upvoteReport = useCallback((reportId: string) => {
    const next = upvoteCommunityReport(reportId);
    setProfile(next);
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<Pick<ChampionProfile, 'displayName' | 'neighborhood' | 'avatar'>>) => {
      const next = updateChampionProfile(updates);
      setProfile(next);
    },
    []
  );

  return {
    profile,
    toast,
    dismissToast: () => setToast(null),
    logHabit,
    submitReport,
    upvoteReport,
    updateProfile,
  };
}
