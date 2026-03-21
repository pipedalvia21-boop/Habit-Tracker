import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

type HabitId = string;
type Tab = "today" | "stats" | "profile";

type Habit = {
  id: HabitId;
  name: string;
  color: string;
};

type CompletionMap = {
  [date: string]: HabitId[];
};

type Profile = {
  name: string;
  email: string;
};

const HABITS_KEY = "habits";
const COMPLETIONS_KEY = "completions";
const PROFILE_KEY = "profile";

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function calculateStreak(habitId: HabitId, completions: CompletionMap): number {
  let streak = 0;
  const d = new Date();
  const todayStr = todayKey();
  const todayIds = completions[todayStr] ?? [];
  if (!todayIds.includes(habitId)) {
    d.setDate(d.getDate() - 1);
  }
  for (let i = 0; i < 365; i++) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    const ids = completions[key] ?? [];
    if (ids.includes(habitId)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const presetColors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#6C5CE7", "#00B894"];

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState<Profile>({ name: "", email: "" });

  const today = todayKey();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [habitsJson, completionsJson, profileJson] = await Promise.all([
          AsyncStorage.getItem(HABITS_KEY),
          AsyncStorage.getItem(COMPLETIONS_KEY),
          AsyncStorage.getItem(PROFILE_KEY)
        ]);
        if (habitsJson) setHabits(JSON.parse(habitsJson));
        if (completionsJson) setCompletions(JSON.parse(completionsJson));
        if (profileJson) setProfile(JSON.parse(profileJson));
      } catch (e) {
        console.warn("Failed to load data", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits)).catch((e) =>
      console.warn("Failed to persist habits", e)
    );
  }, [habits]);

  useEffect(() => {
    AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions)).catch(
      (e) => console.warn("Failed to persist completions", e)
    );
  }, [completions]);

  useEffect(() => {
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch((e) =>
      console.warn("Failed to persist profile", e)
    );
  }, [profile]);

  const toggleCompletion = (habitId: HabitId) => {
    setCompletions((prev) => {
      const todays = new Set(prev[today] ?? []);
      if (todays.has(habitId)) {
        todays.delete(habitId);
      } else {
        todays.add(habitId);
      }
      return { ...prev, [today]: Array.from(todays) };
    });
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    const newHabit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      color: selectedColor
    };
    setHabits((prev) => [...prev, newHabit]);
    setNewHabitName("");
  };

  const removeHabit = (id: HabitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCompletions((prev) => {
      const next: CompletionMap = {};
      for (const [date, ids] of Object.entries(prev)) {
        next[date] = ids.filter((habitId) => habitId !== id);
      }
      return next;
    });
  };

  const saveProfile = () => {
    setProfile(draftProfile);
    setEditingProfile(false);
  };

  const todaysCompletions = new Set(completions[today] ?? []);

  const stats = useMemo(() => {
    const totalDays = Object.keys(completions).length || 1;
    const perHabit: { [id: string]: number } = {};
    for (const dayIds of Object.values(completions)) {
      for (const id of dayIds) {
        perHabit[id] = (perHabit[id] ?? 0) + 1;
      }
    }
    return { totalDays, perHabit };
  }, [completions]);

  const renderHabit = ({ item }: { item: Habit }) => {
    const done = todaysCompletions.has(item.id);
    const streak = calculateStreak(item.id, completions);
    return (
      <View style={styles.habitRow}>
        <TouchableOpacity
          onPress={() => toggleCompletion(item.id)}
          style={[
            styles.checkbox,
            { borderColor: item.color, backgroundColor: done ? item.color : "transparent" }
          ]}
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
        <TouchableOpacity onPress={() => removeHabit(item.id)}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const TodayScreen = () => (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>
        {profile.name ? `Hey, ${profile.name.split(" ")[0]} 👋` : "Today"}
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
          onSubmitEditing={addHabit}
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
        <TouchableOpacity style={styles.addButton} onPress={addHabit}>
          <Text style={styles.addButtonText}>Add habit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const StatsScreen = () => (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Stats</Text>
      {habits.length === 0 ? (
        <Text style={styles.emptyText}>Once you have habits, you will see stats here.</Text>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Days tracked: {stats.totalDays}</Text>
          {habits.map((h) => {
            const count = stats.perHabit[h.id] ?? 0;
            const completionRate = ((count / stats.totalDays) * 100).toFixed(0);
            const streak = calculateStreak(h.id, completions);
            return (
              <View key={h.id} style={styles.statRow}>
                <View style={[styles.colorSwatch, { backgroundColor: h.color }]} />
                <View style={styles.statTextContainer}>
                  <Text style={styles.habitName}>{h.name}</Text>
                  <Text style={styles.statSubText}>
                    Completed {count} day{count === 1 ? "" : "s"} ({completionRate}%)
                  </Text>
                  {streak > 0 && (
                    <Text style={[styles.streakText, { color: h.color }]}>
                      🔥 Current streak: {streak} day{streak === 1 ? "" : "s"}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );

  const ProfileScreen = () => (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>Profile</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profile.name ? profile.name[0].toUpperCase() : "?"}
          </Text>
        </View>
        {!editingProfile ? (
          <>
            <Text style={styles.profileName}>{profile.name || "No name set"}</Text>
            <Text style={styles.profileEmail}>{profile.email || "No email set"}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setDraftProfile(profile);
                setEditingProfile(true);
              }}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              value={draftProfile.name}
              onChangeText={(t) => setDraftProfile((p) => ({ ...p, name: t }))}
              placeholder="Your name"
              style={styles.input}
            />
            <Text style={styles.sectionLabel}>Email</Text>
            <TextInput
              value={draftProfile.email}
              onChangeText={(t) => setDraftProfile((p) => ({ ...p, email: t }))}
              placeholder="your@email.com"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addButton} onPress={saveProfile}>
              <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, { marginTop: 8 }]}
              onPress={() => setEditingProfile(false)}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.sectionLabel}>Your Stats</Text>
        <Text style={styles.statSummary}>Total habits: {habits.length}</Text>
        <Text style={styles.statSummary}>Days tracked: {Object.keys(completions).length}</Text>
        <Text style={styles.statSummary}>
          Completions today: {(completions[today] ?? []).length}/{habits.length}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {activeTab === "today" && <TodayScreen />}
        {activeTab === "stats" && <StatsScreen />}
        {activeTab === "profile" && <ProfileScreen />}
        <View style={styles.tabBar}>
          {(["today", "stats", "profile"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ExpoStatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F5F7", paddingTop: StatusBar.currentHeight ?? 0 },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 16 },
  screen: { flex: 1, paddingTop: 16 },
  screenTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: "#111827" },
  emptyText: { marginTop: 16, fontSize: 16, color: "#6B7280" },
  habitRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxText: { color: "#fff", fontWeight: "700" },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  streakText: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  deleteText: { fontSize: 22, color: "#9CA3AF", paddingHorizontal: 8 },
  newHabitContainer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 6 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 12, backgroundColor: "#FFFFFF", fontSize: 15, marginBottom: 8 },
  colorRow: { flexDirection: "row", marginBottom: 8 },
  colorDot: { width: 24, height: 24, borderRadius: 12, marginRight: 8, borderColor: "#111827" },
  addButton: { marginTop: 4, backgroundColor: "#111827", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  tabBar: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 999, padding: 4, marginTop: 8 },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  tabItemActive: { backgroundColor: "#FFFFFF" },
  tabLabel: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  tabLabelActive: { color: "#111827" },
  statRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  colorSwatch: { width: 16, height: 16, borderRadius: 4, marginRight: 8 },
  statTextContainer: { flex: 1 },
  statSubText: { fontSize: 13, color: "#6B7280" },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center" },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  profileName: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  profileEmail: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  editButton: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 24 },
  editButtonText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16 },
  statSummary: { fontSize: 15, color: "#374151", marginBottom: 6 }
});
