import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type HabitId = string;

type Habit = {
  id: HabitId;
  name: string;
  color: string;
};

type CompletionMap = {
  [date: string]: HabitId[];
};

type Props = {
  habits: Habit[];
  completions: CompletionMap;
  onRecover: (updatedCompletions: CompletionMap) => void;
};

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function StreakRecovery({ habits, completions, onRecover }: Props) {
  const [recovered, setRecovered] = useState<HabitId[]>([]);
  const yesterday = yesterdayKey();
  const yesterdayCompletions = completions[yesterday] ?? [];

  const missedHabits = habits.filter(
    (h) => !yesterdayCompletions.includes(h.id) && !recovered.includes(h.id)
  );

  if (missedHabits.length === 0) return null;

  const recoverHabit = (habitId: HabitId) => {
    const updated = {
      ...completions,
      [yesterday]: [...yesterdayCompletions, habitId]
    };
    onRecover(updated);
    setRecovered((prev) => [...prev, habitId]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>⚡ Streak Recovery</Text>
      <Text style={styles.subtitle}>
        You missed these habits yesterday. Recover your streak?
      </Text>
      {missedHabits.map((h) => (
        <View key={h.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: h.color }]} />
          <Text style={styles.habitName}>{h.name}</Text>
          <TouchableOpacity
            style={[styles.recoverBtn, { borderColor: h.color }]}
            onPress={() => recoverHabit(h.id)}
          >
            <Text style={[styles.recoverText, { color: h.color }]}>Recover</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#FDE68A" },
  title: { fontSize: 16, fontWeight: "700", color: "#92400E", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#92400E", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  habitName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827" },
  recoverBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 },
  recoverText: { fontSize: 13, fontWeight: "600" }
});
