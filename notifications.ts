import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleHabitReminder(
  habitName: string,
  hour: number,
  minute: number
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Habit Reminder",
      body: `Don't forget: ${habitName}`,
      sound: true
    },
    trigger: {
      hour,
      minute,
      repeats: true
    } as any
  });
  return id;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
