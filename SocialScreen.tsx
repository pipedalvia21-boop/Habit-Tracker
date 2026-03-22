import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { User } from "firebase/auth";
import {
  saveUserProfile,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  getFriendActivity,
  likePost,
  unlikePost,
  addComment
} from "./socialService";

type Props = {
  user: User;
  userName: string;
};

type ActivityPost = {
  id: string;
  uid: string;
  userName: string;
  habitName: string;
  streak: number;
  likes: string[];
  comments: { uid: string; userName: string; text: string }[];
};

type FriendRequest = {
  from: string;
  to: string;
  status: string;
};

export default function SocialScreen({ user, userName }: Props) {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [feed, setFeed] = useState<ActivityPost[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"feed" | "friends">("feed");

  useEffect(() => {
    saveUserProfile(user.uid, userName || user.email || "", user.email || "");
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, r] = await Promise.all([
        getFriends(user.uid),
        getFriendRequests(user.uid)
      ]);
      setFriends(f);
      setRequests(r);
      const friendUids = f.map((fr: any) => fr.uid);
      if (friendUids.length > 0) {
        const activity = await getFriendActivity(friendUids);
        setFeed(activity as ActivityPost[]);
      }
    } catch (e) {
      console.warn("Error loading social data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    const results = await searchUsers(searchEmail.trim());
    const found = results.find((u: any) => u.uid !== user.uid);
    setSearchResult(found ?? null);
  };

  const handleAddFriend = async (toUid: string) => {
    await sendFriendRequest(user.uid, toUid);
    setSearchResult(null);
    setSearchEmail("");
  };

  const handleAccept = async (fromUid: string) => {
    await acceptFriendRequest(fromUid, user.uid);
    loadData();
  };

  const handleLike = async (post: ActivityPost) => {
    if (post.likes.includes(user.uid)) {
      await unlikePost(post.id, user.uid);
    } else {
      await likePost(post.id, user.uid);
    }
    loadData();
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    await addComment(postId, user.uid, userName || user.email || "", text);
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>Social</Text>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, activeSection === "feed" && styles.segmentActive]}
          onPress={() => setActiveSection("feed")}
        >
          <Text style={[styles.segmentText, activeSection === "feed" && styles.segmentTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeSection === "friends" && styles.segmentActive]}
          onPress={() => setActiveSection("friends")}
        >
          <Text style={[styles.segmentText, activeSection === "friends" && styles.segmentTextActive]}>
            Friends {friends.length > 0 ? `(${friends.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === "friends" && (
        <>
          {requests.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Friend Requests</Text>
              {requests.map((r) => (
                <View key={r.from} style={styles.requestRow}>
                  <Text style={styles.requestText}>{r.from}</Text>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(r.from)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Add Friend</Text>
            <TextInput
              value={searchEmail}
              onChangeText={setSearchEmail}
              placeholder="Search by email"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
            {searchResult && (
              <View style={styles.searchResult}>
                <Text style={styles.searchResultName}>{searchResult.name || searchResult.email}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAddFriend(searchResult.uid)}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
            {searchResult === null && searchEmail && (
              <Text style={styles.noResult}>No user found</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Your Friends ({friends.length})</Text>
            {friends.length === 0 ? (
              <Text style={styles.emptyText}>No friends yet. Search by email to add friends.</Text>
            ) : (
              friends.map((f) => (
                <View key={f.uid} style={styles.friendRow}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{(f.name || f.email)[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.friendName}>{f.name || f.email}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {activeSection === "feed" && (
        <>
          {feed.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                No activity yet. Add friends to see their habit completions here!
              </Text>
            </View>
          ) : (
            feed.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{post.userName[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.postUser}>{post.userName}</Text>
                    <Text style={styles.postHabit}>
                      completed {post.habitName} 🔥 {post.streak} day streak
                    </Text>
                  </View>
                </View>
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(post)}>
                    <Text style={styles.likeBtnText}>
                      {post.likes.includes(user.uid) ? "❤️" : "🤍"} {post.likes.length}
                    </Text>
                  </TouchableOpacity>
                </View>
                {post.comments.length > 0 && (
                  <View style={styles.commentsSection}>
                    {post.comments.map((c, i) => (
                      <Text key={i} style={styles.comment}>
                        <Text style={styles.commentUser}>{c.userName}: </Text>{c.text}
                      </Text>
                    ))}
                  </View>
                )}
                <View style={styles.commentInputRow}>
                  <TextInput
                    value={commentText[post.id] ?? ""}
                    onChangeText={(t) => setCommentText((prev) => ({ ...prev, [post.id]: t }))}
                    placeholder="Add a comment..."
                    style={styles.commentInput}
                  />
                  <TouchableOpacity onPress={() => handleComment(post.id)}>
                    <Text style={styles.commentSend}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  screenTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: "#111827" },
  segmentRow: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 999, padding: 4, marginBottom: 16 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  segmentActive: { backgroundColor: "#FFFFFF" },
  segmentText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  segmentTextActive: { color: "#111827" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 12, backgroundColor: "#F9FAFB", fontSize: 15, marginBottom: 8 },
  searchBtn: { backgroundColor: "#111827", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  searchBtnText: { color: "#FFFFFF", fontWeight: "600" },
  searchResult: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  searchResultName: { flex: 1, fontSize: 15, color: "#111827" },
  addBtn: { backgroundColor: "#6C5CE7", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 },
  addBtnText: { color: "#FFFFFF", fontWeight: "600" },
  noResult: { marginTop: 8, fontSize: 13, color: "#9CA3AF" },
  friendRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  friendAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#6C5CE7", alignItems: "center", justifyContent: "center", marginRight: 10 },
  friendAvatarText: { color: "#FFFFFF", fontWeight: "700" },
  friendName: { fontSize: 15, color: "#111827" },
  requestRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  requestText: { flex: 1, fontSize: 14, color: "#111827" },
  acceptBtn: { backgroundColor: "#00B894", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 },
  acceptText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  postCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  postUser: { fontSize: 15, fontWeight: "700", color: "#111827" },
  postHabit: { fontSize: 13, color: "#6B7280" },
  postActions: { flexDirection: "row", marginBottom: 8 },
  likeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  likeBtnText: { fontSize: 16 },
  commentsSection: { marginBottom: 8 },
  comment: { fontSize: 13, color: "#374151", marginBottom: 2 },
  commentUser: { fontWeight: "700" },
  commentInputRow: { flexDirection: "row", alignItems: "center" },
  commentInput: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 10, fontSize: 13, backgroundColor: "#F9FAFB" },
  commentSend: { marginLeft: 8, fontSize: 13, fontWeight: "600", color: "#6C5CE7" }
});
