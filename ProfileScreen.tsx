import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from "react-native";
import { signOut, User } from "firebase/auth";
import { auth } from "./firebaseConfig";
import ProfilePicture from "./ProfilePicture";

type Profile = {
  name: string;
  email: string;
  photoUrl?: string;
};

type CompletionMap = {
  [date: string]: string[];
};

type Props = {
  user: User;
  profile: Profile;
  habits: any[];
  completions: CompletionMap;
  today: string;
  onSave: (p: Profile) => void;
};

export default function ProfileScreen({ user, profile, habits, completions, today, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>Profile</Text>
      <View style={styles.profileCard}>
        <ProfilePicture
          currentUrl={profile.photoUrl}
          name={profile.name || user?.email || ""}
          onUpload={(url) => {
            const updated = { ...profile, photoUrl: url };
            onSave(updated);
          }}
        />
        {!editing ? (
          <>
            <Text style={styles.profileName}>{profile.name || "No name set"}</Text>
            <Text style={styles.profileEmail}>{profile.email || user?.email || "No email set"}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => { setDraft(profile); setEditing(true); }}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft((p) => ({ ...p, name: t }))}
              placeholder="Your name"
              style={styles.input}
            />
            <Text style={styles.sectionLabel}>Email</Text>
            <TextInput
              value={draft.email}
              onChangeText={(t) => setDraft((p) => ({ ...p, email: t }))}
              placeholder="your@email.com"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addButton} onPress={save}>
              <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editButton, { marginTop: 8 }]} onPress={() => setEditing(false)}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.sectionLabel}>Your Stats</Text>
        <Text style={styles.statSummary}>Total habits: {habits.length}</Text>
        <Text style={styles.statSummary}>Days tracked: {Object.keys(completions).length}</Text>
        <Text style={styles.statSummary}>Completions today: {(completions[today] ?? []).length}/{habits.length}</Text>
      </View>
      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut(auth)}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 16 },
  screenTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: "#111827" },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center" },
  profileName: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  profileEmail: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  editButton: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 24 },
  editButtonText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 6 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 12, backgroundColor: "#FFFFFF", fontSize: 15, marginBottom: 8, width: "100%" },
  addButton: { marginTop: 4, backgroundColor: "#111827", borderRadius: 10, paddingVertical: 10, alignItems: "center", width: "100%" },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16 },
  statSummary: { fontSize: 15, color: "#374151", marginBottom: 6 },
  signOutButton: { backgroundColor: "#EF4444", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginBottom: 32 },
  signOutText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 }
});
