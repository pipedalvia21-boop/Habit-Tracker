import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "./firebaseConfig";

type Props = {
  onAuth: () => void;
};

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuth();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuth();
    } catch (e: any) {
      setError(e.message ?? "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Habit Tracker</Text>
      <Text style={styles.subtitle}>
        {mode === "login" ? "Welcome back!" : "Create your account"}
      </Text>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={googleLoading}>
        {googleLoading ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        style={styles.input}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "login" ? "Log In" : "Sign Up"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        <Text style={styles.switchText}>
          {mode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#F5F5F7"
  },
  title: { fontSize: 36, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 32 },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16
  },
  googleIcon: { fontSize: 18, fontWeight: "700", color: "#4285F4", marginRight: 8 },
  googleButtonText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: "#9CA3AF" },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB",
    paddingHorizontal: 16, backgroundColor: "#FFFFFF", fontSize: 15, marginBottom: 12
  },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 8, textAlign: "center" },
  button: {
    backgroundColor: "#111827", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginBottom: 16
  },
  buttonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  switchText: { color: "#6B7280", textAlign: "center", fontSize: 14 }
});
