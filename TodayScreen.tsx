import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert
} from "react-native";
import { requestNotificationPermissions, scheduleHabitReminder, cancelReminder } from "./notifications";

type HabitId = string;

type Habit = {
  id: HabitId;
  name: string;
  color: string;
  reminderId?: string;
};

type CompletionMap = {
  [date: string]: HabitId[];
};

type Props = {
  habits: Habit[];
  completions: CompletionMap;
  today: string;
  profileName: string;
  onToggleCompletion: (id: HabitId) => void;
  onAddHabit: (name: string, color: string) => void;
  onRemoveHabit: (id: HabitId) => void;
  onUpdateHabit: (habit: Habit) => void;
};

const presetColors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#6C5CE7", "#00B894"];

function calculateStreak(habitId: HabitId, completions: CompletionMap): number {
  let streak = 0;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const todayIds = completions[todayStr] ?? [];
  if (!todayIds.includes(habitId)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    const ids = completions[key] ?? [];
    if (ids.includes(habitId)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export default function TodayScreen({
  habits, completions, today, profileName,
  onToggleCompletion, onAddHabit, onRemoveHabit, onUpdateHabit
}: Props) {
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);

  const todaysCompletions = new Set(completions[today] ?? []);

  const handleAdd = () => {
    const name = newHabitName.trim();
    if (!name) return;
    onAddHabit(name, selectedColor);
    setNewHabitName("");
  };

  const toggleReminder = async (habit: Habit) => {
    if (Platform.OS === "web") {
      Alert.alert("Reminders", "Push notifications are only available on mobile devices.");
      return;
    }
    if (habit.reminderId) {
      await cancelReminder(habit.reminderId);
      onUpdateHabit({ ...habit, reminderId: undefined });
    } else {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permission denied", "Please enable notifications in your settings.");
        return;
      }
      const id = await scheduleHabitReminder(habit.name, 9, 0);
      if (id) onUpdateHabit({ ...habit, reminderId: id });
    }
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const done = todaysCompletions.has(item.id);
    const streak = calculateStreak(item.id, completions);
    return (
      <View style={styles.habitRow}>
        <TouchableOpacity
          onPress={() => onToggleCompletion(item.id)}
          style={[styles.checkbox, { borderColor: item.color, backgroundColor: done ? item.color : "transparent" }]}
        >
          {done && <Text style={styles.checkboxText}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{item.name}</Text>
          {streak > 0 && (
            <Text style={[styles.streakText, { color: item.color }]}>
              🔥 {streak} day{streak === 1 ? "" : "s"} streak
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => toggleReminder(item)} style={styles.reminderBtn}>
          <Text style={{ fontSize: 18 }}>{item.reminderId ? "🔔" : "🔕"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRemoveHabit(item.id)}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>
        {profileName ? `Hey, ${profileName.split(" ")[0]} 👋` : "Today"}
      </Text>
      {habits.length === 0 ? (
        <Text style={styles.emptyText}>Add your first habit below to get started.</Text>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabit}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
      <View style={styles.newHabitContainer}>
        <Text style={styles.sectionLabel}>New habit</Text>
        <TextInput
          value={newHabitName}
          onChangeText={setNewHabitName}
          placeholder="e.g. Drink 2L of water"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <View style={styles.colorRow}>
          {presetColors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 2 : 0 }]}
              onPress={() => setSelectedColor(c)}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add habit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 16 },
  screenTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: "#111827" },
  emptyText: { marginTop: 16, fontSize: 16, color: "#6B7280" },
  habitRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxText: { color: "#fff", fontWeight: "700" },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  streakText: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  reminderBtn: { paddingHorizontal: 6 },
  deleteText: { fontSize: 22, color: "#9CA3AF", paddingHorizontal: 8 },
  newHabitContainer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 6 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 12, backgroundColor: "#FFFFFF", fontSize: 15, marginBottom: 8 },
  colorRow: { flexDirection: "row", marginBottom: 8 },
  colorDot: { width: 24, height: 24, borderRadius: 12, marginRight: 8, borderColor: "#111827" },
  addButton: { marginTop: 4, backgroundColor: "#111827", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 }
});
