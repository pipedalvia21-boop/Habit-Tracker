import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from "react-native";

type Suggestion = {
  id: string;
  name: string;
  description: string;
  frequency: string;
  accepted: boolean | null;
};

type Props = {
  onAcceptHabit: (name: string, color: string) => void;
};

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFD166", "#6C5CE7", "#00B894"];

export default function AIScreen({ onAcceptHabit }: Props) {
  const [goal, setGoal] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getSuggestions = async () => {
    if (!goal.trim()) return;
    setError("");
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a habit coach. When given a goal, suggest exactly 4 daily habits to help achieve it. Respond ONLY with a JSON array with this format: [{\"name\": \"habit name\", \"description\": \"why this helps\", \"frequency\": \"Daily\"}]. No other text."
            },
            {
              role: "user",
              content: `My goal: ${goal}`
            }
          ],
          max_tokens: 500
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setSuggestions(
        parsed.map((s: any, i: number) => ({
          id: `${Date.now()}-${i}`,
          name: s.name,
          description: s.description,
          frequency: s.frequency,
          accepted: null
        }))
      );
    } catch (e) {
      setError("Failed to get suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (suggestion: Suggestion) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    onAcceptHabit(suggestion.name, color);
    setSuggestions((prev) =>
      prev.map((s) => s.id === suggestion.id ? { ...s, accepted: true } : s)
    );
  };

  const handleReject = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => s.id === id ? { ...s, accepted: false } : s)
    );
  };

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>🤖 AI Coach</Text>
      <Text style={styles.subtitle}>Tell me your goal and I'll suggest habits to help you get there.</Text>

      <View style={styles.inputCard}>
        <Text style={styles.sectionLabel}>What's your goal?</Text>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="e.g. I want to be healthier, more productive..."
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={getSuggestions}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>✨ Get Habit Suggestions</Text>
          )}
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {suggestions.length > 0 && (
        <View>
          <Text style={styles.suggestionsTitle}>Suggested Habits</Text>
          {suggestions.map((s) => (
            <View
              key={s.id}
              style={[
                styles.suggestionCard,
                s.accepted === true && styles.cardAccepted,
                s.accepted === false && styles.cardRejected
              ]}
            >
              <Text style={styles.habitName}>{s.name}</Text>
              <Text style={styles.habitDesc}>{s.description}</Text>
              <Text style={styles.habitFreq}>⏰ {s.frequency}</Text>

              {s.accepted === null && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(s)}
                  >
                    <Text style={styles.acceptText}>✅ Add Habit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(s.id)}
                  >
                    <Text style={styles.rejectText}>✕ Skip</Text>
                  </TouchableOpacity>
                </View>
              )}
              {s.accepted === true && (
                <Text style={styles.acceptedLabel}>✅ Added to your habits!</Text>
              )}
              {s.accepted === false && (
                <Text style={styles.rejectedLabel}>Skipped</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 16 },
  screenTitle: { fontSize: 28, fontWeight: "700", marginBottom: 4, color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  inputCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F9FAFB", fontSize: 15, marginBottom: 12, minHeight: 80, textAlignVertical: "top" },
  button: { backgroundColor: "#6C5CE7", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  error: { color: "#EF4444", fontSize: 13, marginTop: 8, textAlign: "center" },
  suggestionsTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  suggestionCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: "#E5E7EB" },
  cardAccepted: { borderColor: "#00B894" },
  cardRejected: { borderColor: "#E5E7EB", opacity: 0.5 },
  habitName: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  habitDesc: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  habitFreq: { fontSize: 12, color: "#9CA3AF", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: "#00B894", borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  acceptText: { color: "#FFFFFF", fontWeight: "600" },
  rejectBtn: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  rejectText: { color: "#6B7280", fontWeight: "600" },
  acceptedLabel: { fontSize: 13, color: "#00B894", fontWeight: "600" },
  rejectedLabel: { fontSize: 13, color: "#9CA3AF" }
});
