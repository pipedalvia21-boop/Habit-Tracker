import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const CLOUDINARY_CLOUD_NAME = "desf3l3lk";
const CLOUDINARY_UPLOAD_PRESET = "habit-tracker";

type Props = {
  currentUrl?: string;
  name: string;
  onUpload: (url: string) => void;
};

export default function ProfilePicture({ currentUrl, name, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photo library.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });

    if (!result.canceled && result.assets[0]) {
      await uploadToCloudinary(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("file", blob);
      } else {
        formData.append("file", {
          uri,
          type: "image/jpeg",
          name: "profile.jpg"
        } as any);
      }

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "habit-tracker-profiles");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        onUpload(data.secure_url);
      } else {
        Alert.alert("Upload failed", "Could not upload image. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={pickImage} style={styles.container} disabled={uploading}>
      {uploading ? (
        <View style={styles.avatar}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : currentUrl ? (
        <Image source={{ uri: currentUrl }} style={styles.image} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : "?"}
          </Text>
        </View>
      )}
      <View style={styles.editBadge}>
        <Text style={styles.editBadgeText}>📷</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { width: 80, height: 80, position: "relative", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  image: { width: 80, height: 80, borderRadius: 40 },
  editBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#6C5CE7", borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  editBadgeText: { fontSize: 12 }
});
