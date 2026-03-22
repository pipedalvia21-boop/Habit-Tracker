import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

type Badge = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  condition: (stats: BadgeStats) => boolean;
};

type BadgeStats = {
  totalCompletions: number;
  totalHabits: number;
  longestStreak: number;
  daysTracked: number;
};

const ALL_BADGES: Badge[] = [
  {
    id: "first_habit",
    emoji: "🌟",
    name: "First Step",
    description: "Add your first habit",
    condition: (s) => s.totalHabits >= 1
  },
  {
    id: "first_completion",
    emoji: "✅",
    name: "Getting Started",
    description: "Complete a habit for the first time",
    condition: (s) => s.totalCompletions >= 1
  },
  {
    id: "streak_3",
    emoji: "🔥",
    name: "On Fire",
    description: "Reach a 3-day streak",
    condition: (s) => s.longestStreak >= 3
  },
  {
    id: "streak_7",
    emoji: "⚡",
    name: "Week Warrior",
    description: "Reach a 7-day streak",
    condition: (s) => s.longestStreak >= 7
  },
  {
    id: "completions_10",
    emoji: "💪",
    name: "Habit Builder",
    description: "Complete habits 10 times",
    condition: (s) => s.totalCompletions >= 10
  },
  {
    id: "completions_30",
    emoji: "🏆",
    name: "Consistency King",
    description: "Complete habits 30 times",
    condition: (s) => s.totalCompletions >= 30
  },
  {
    id: "days_7",
    emoji: "📅",
    name: "Week Tracker",
    description: "Track habits for 7 days",
    condition: (s) => s.daysTracked >= 7
  },
  {
    id: "habits_3",
    emoji: "🎯",
    name: "Multi-Tasker",
    description: "Add 3 or more habits",
    condition: (s) => s.totalHabits >= 3
  }
];

export function getEarnedBadges(stats: BadgeStats): Badge[] {
  return ALL_BADGES.filter((b) => b.condition(stats));
}

type Props = {
  stats: BadgeStats;
};

export default function BadgeDisplay({ stats }: Props) {
  const earned = getEarnedBadges(stats);
  const notEarned = ALL_BADGES.filter((b) => !b.condition(stats));

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>
        Badges — {earned.length}/{ALL_BADGES.length} earned
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeRow}>
        {earned.map((b) => (
          <View key={b.id} style={[styles.badge, styles.badgeEarned]}>
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
            <Text style={styles.badgeName}>{b.name}</Text>
          </View>
        ))}
        {notEarned.map((b) => (
          <View key={b.id} style={[styles.badge, styles.badgeLocked]}>
            <Text style={styles.badgeEmoji}>🔒</Text>
            <Text style={styles.badgeNameLocked}>{b.name}</Text>
          </View>
        ))}
      </ScrollView>
      {earned.length > 0 && (
        <Text style={styles.latestBadge}>
          Latest: {earned[earned.length - 1].emoji} {earned[earned.length - 1].name} — {earned[earned.length - 1].description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 12 },
  badgeRow: { flexDirection: "row", marginBottom: 8 },
  badge: { alignItems: "center", marginRight: 12, width: 64 },
  badgeEarned: { opacity: 1 },
  badgeLocked: { opacity: 0.3 },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 11, fontWeight: "600", color: "#111827", textAlign: "center" },
  badgeNameLocked: { fontSize: 11, color: "#9CA3AF", textAlign: "center" },
  latestBadge: { fontSize: 12, color: "#6B7280", marginTop: 4 }
});
