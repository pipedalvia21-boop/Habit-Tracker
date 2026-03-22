import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Rank = {
  name: string;
  emoji: string;
  color: string;
  minCompletions: number;
  maxCompletions: number | null;
};

const RANKS: Rank[] = [
  { name: "Rookie", emoji: "🌱", color: "#6B7280", minCompletions: 0, maxCompletions: 9 },
  { name: "Challenger", emoji: "⚡", color: "#F59E0B", minCompletions: 10, maxCompletions: 29 },
  { name: "Master", emoji: "🏆", color: "#8B5CF6", minCompletions: 30, maxCompletions: 99 },
  { name: "Legend", emoji: "🔥", color: "#EF4444", minCompletions: 100, maxCompletions: null }
];

export function getRank(totalCompletions: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalCompletions >= RANKS[i].minCompletions) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

export function getNextRank(totalCompletions: number): Rank | null {
  const currentRank = getRank(totalCompletions);
  const currentIndex = RANKS.findIndex((r) => r.name === currentRank.name);
  if (currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  return null;
}

type Props = {
  totalCompletions: number;
};

export default function RankCard({ totalCompletions }: Props) {
  const rank = getRank(totalCompletions);
  const nextRank = getNextRank(totalCompletions);
  const progress = nextRank
    ? ((totalCompletions - rank.minCompletions) / (nextRank.minCompletions - rank.minCompletions)) * 100
    : 100;

  return (
    <View style={styles.card}>
      <View style={styles.rankHeader}>
        <Text style={styles.rankEmoji}>{rank.emoji}</Text>
        <View>
          <Text style={[styles.rankName, { color: rank.color }]}>{rank.name}</Text>
          <Text style={styles.rankSub}>{totalCompletions} total completions</Text>
        </View>
      </View>
      {nextRank && (
        <>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` as any, backgroundColor: rank.color }]} />
          </View>
          <Text style={styles.progressText}>
            {nextRank.minCompletions - totalCompletions} more to reach {nextRank.emoji} {nextRank.name}
          </Text>
        </>
      )}
      {!nextRank && (
        <Text style={styles.progressText}>🎉 You've reached the highest rank!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16 },
  rankHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rankEmoji: { fontSize: 36, marginRight: 12 },
  rankName: { fontSize: 20, fontWeight: "700" },
  rankSub: { fontSize: 13, color: "#6B7280" },
  progressBarBg: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 999, marginBottom: 6 },
  progressBarFill: { height: 8, borderRadius: 999 },
  progressText: { fontSize: 12, color: "#6B7280" }
});
