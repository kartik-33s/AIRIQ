import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevelAndTier,
  createDefaultProfile,
  logHabitAction,
  submitCommunityIncidentReport,
  upvoteCommunityReport,
} from './championStore';

test('Level and Rank Tier progression math', () => {
  // Level 1: 0 - 149 XP
  const l1 = calculateLevelAndTier(50);
  assert.equal(l1.level, 1);
  assert.equal(l1.rankTier, 'Bronze Scout');
  assert.equal(l1.xpNextLevel, 150);

  // Level 2: 150 - 299 XP
  const l2 = calculateLevelAndTier(160);
  assert.equal(l2.level, 2);
  assert.equal(l2.rankTier, 'Silver Guardian');

  // Level 4: 450 - 599 XP
  const l4 = calculateLevelAndTier(480);
  assert.equal(l4.level, 4);
  assert.equal(l4.rankTier, 'Gold Sentinel');

  // Level 6: 750 - 899 XP
  const l6 = calculateLevelAndTier(770);
  assert.equal(l6.level, 6);
  assert.equal(l6.rankTier, 'Emerald Ambassador');

  // Level 8+: Diamond Champion
  const l8 = calculateLevelAndTier(1200);
  assert.equal(l8.level, 9);
  assert.equal(l8.rankTier, 'Diamond Champion');
});

test('Default profile generation initializes clean baseline', () => {
  const profile = createDefaultProfile();
  assert.ok(profile.userId.startsWith('user_'));
  assert.equal(profile.displayName, 'Clean Air Guardian');
  assert.ok(profile.badges.length >= 8);
  assert.ok(profile.dailyHabits.length >= 5);
  assert.ok(profile.communityReports.length >= 3);
  assert.equal(profile.currentStreak, 2);
});

test('Logging a habit awards correct XP and increments environmental metrics', () => {
  const result = logHabitAction('habit_active', 'Kharar');
  assert.equal(result.xpEarned, 35);
  assert.ok(result.profile.xp >= 160);
  assert.ok(result.profile.stats.co2AvertedKg >= 15);
  assert.ok(result.profile.stats.pm25AvertedGrams >= 20);
});

test('Submitting community incident report registers hazard and awards XP', () => {
  const result = submitCommunityIncidentReport({
    city: 'Kharar',
    neighborhood: 'Sector 125',
    hazardType: 'garbage_burning',
    severity: 'High',
    description: 'Burning leaves and plastic along main road.',
    coordinates: { lat: 30.74, lng: 76.64 },
  });

  assert.equal(result.xpEarned, 50);
  assert.equal(result.newReport.hazardType, 'garbage_burning');
  assert.equal(result.profile.communityReports[0].id, result.newReport.id);
  assert.ok(result.profile.stats.totalReportsSubmitted >= 2);
});

test('Upvoting a neighbor report grants community validation XP', () => {
  const profile = upvoteCommunityReport('rep-01');
  const targetReport = profile.communityReports.find((r) => r.id === 'rep-01');
  assert.ok(targetReport);
  assert.equal(targetReport.userUpvoted, true);
  assert.equal(targetReport.upvotes, 9);
});
