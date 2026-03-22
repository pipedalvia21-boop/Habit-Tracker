import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
};

function getLast7Days(): string[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeeklyAnalytics({ habits, completions }: Props) {
  const last7Days = getLast7Days();
  const totalHabits = habits.length || 1;

  const weeklyData = last7Days.map((date) => {
    const completed = (completions[date] ?? []).length;
    const percentage = Math.round((completed / totalHabits) * 100);
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    return { date, completed, percentage, label: DAY_LABELS[dayOfWeek] };
  });

  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.completed, 0);
  const weeklyAvg = Math.round(weeklyTotal / 7);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📅 Weekly Analytics</Text>
      <Text style={styles.subtitle}>
        {weeklyTotal} completions this week · avg {weeklyAvg}/day
      </Text>
      <View style={styles.barChart}>
        {weeklyData.map((day) => (
          <View key={day.date} style={styles.barColumn}>
            <Text style={styles.barValue}>{day.completed}</Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { height: `${Math.max(day.percentage, 4)}%` as any }
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{day.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", height: 120, justifyContent: "space-between" },
  barColumn: { flex: 1, alignItems: "center", height: "100%" },
  barValue: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  barBg: { flex: 1, width: 28, backgroundColor: "#F3F4F6", borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", backgroundColor: "#6C5CE7", borderRadius: 6 },
  barLabel: { fontSize: 11, color: "#6B7280", marginTop: 4 }
});
