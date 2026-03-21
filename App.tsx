import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebaseConfig";
import AuthScreen from "./AuthScreen";
import ProfileScreen from "./ProfileScreen";
import TodayScreen from "./TodayScreen";

type HabitId = string;
type Tab = "today" | "stats" | "profile";

type Habit = {
  id: HabitId;
  name: string;
  color: string;
  reminderId?: string;
};

type CompletionMap = {
  [date: string]: HabitId[];
};

type Profile = {
  name: string;
  email: string;
};

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
  if (!todayIds.includes(habitId)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    const ids = completions[key] ?? [];
    if (ids.includes(habitId)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });

  const today = todayKey();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [habitsJson, completionsJson, profileJson] = await Promise.all([
          AsyncStorage.getItem(`${user.uid}_habits`),
          AsyncStorage.getItem(`${user.uid}_completions`),
          AsyncStorage.getItem(`${user.uid}_profile`)
        ]);
        if (habitsJson) setHabits(JSON.parse(habitsJson));
        if (completionsJson) setCompletions(JSON.parse(completionsJson));
        if (profileJson) setProfile(JSON.parse(profileJson));
        else setProfile({ name: "", email: user.email ?? "" });
      } catch (e) {
        console.warn("Failed to load data", e);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`${user.uid}_habits`, JSON.stringify(habits));
  }, [habits, user]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`${user.uid}_completions`, JSON.stringify(completions));
  }, [completions, user]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`${user.uid}_profile`, JSON.stringify(profile));
  }, [profile, user]);

  const toggleCompletion = (habitId: HabitId) => {
    setCompletions((prev) => {
      const todays = new Set(prev[today] ?? []);
      if (todays.has(habitId)) todays.delete(habitId);
      else todays.add(habitId);
      return { ...prev, [today]: Array.from(todays) };
    });
  };

  const addHabit = (name: string, color: string) => {
    const newHabit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      color
    };
    setHabits((prev) => [...prev, newHabit]);
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

  const updateHabit = (updated: Habit) => {
    setHabits((prev) => prev.map((h) => h.id === updated.id ? updated : h));
  };

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

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: "#6B7280" }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthScreen onAuth={() => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {activeTab === "today" && (
          <TodayScreen
            habits={habits}
            completions={completions}
            today={today}
            profileName={profile.name}
            onToggleCompletion={toggleCompletion}
            onAddHabit={addHabit}
            onRemoveHabit={removeHabit}
            onUpdateHabit={updateHabit}
          />
        )}
        {activeTab === "stats" && (
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
        )}
        {activeTab === "profile" && (
          <ProfileScreen
            user={user}
            profile={profile}
            habits={habits}
            completions={completions}
            today={today}
            onSave={setProfile}
          />
        )}
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
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 6 },
  statRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  colorSwatch: { width: 16, height: 16, borderRadius: 4, marginRight: 8 },
  statTextContainer: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  statSubText: { fontSize: 13, color: "#6B7280" },
  streakText: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  tabBar: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 999, padding: 4, marginTop: 8 },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  tabItemActive: { backgroundColor: "#FFFFFF" },
  tabLabel: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  tabLabelActive: { color: "#111827" }
});
