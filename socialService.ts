import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ── User Profile ──────────────────────────────────────
export async function saveUserProfile(uid: string, name: string, email: string) {
  await setDoc(doc(db, "users", uid), { uid, name, email, friends: [] }, { merge: true });
}

export async function searchUsers(email: string) {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

// ── Friends ───────────────────────────────────────────
export async function sendFriendRequest(fromUid: string, toUid: string) {
  await setDoc(doc(db, "friendRequests", `${fromUid}_${toUid}`), {
    from: fromUid,
    to: toUid,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

export async function acceptFriendRequest(fromUid: string, toUid: string) {
  await updateDoc(doc(db, "users", fromUid), { friends: arrayUnion(toUid) });
  await updateDoc(doc(db, "users", toUid), { friends: arrayUnion(fromUid) });
  await updateDoc(doc(db, "friendRequests", `${fromUid}_${toUid}`), { status: "accepted" });
}

export async function getFriendRequests(uid: string) {
  const q = query(collection(db, "friendRequests"), where("to", "==", uid), where("status", "==", "pending"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function getFriends(uid: string) {
  const userDoc = await getDoc(doc(db, "users", uid));
  const data = userDoc.data();
  if (!data?.friends?.length) return [];
  const friends = [];
  for (const friendUid of data.friends) {
    const friendDoc = await getDoc(doc(db, "users", friendUid));
    if (friendDoc.exists()) friends.push(friendDoc.data());
  }
  return friends;
}

// ── Activity Feed ─────────────────────────────────────
export async function postActivity(uid: string, userName: string, habitName: string, streak: number) {
  await addDoc(collection(db, "activity"), {
    uid,
    userName,
    habitName,
    streak,
    likes: [],
    comments: [],
    createdAt: serverTimestamp()
  });
}

export async function getFriendActivity(friendUids: string[]) {
  if (!friendUids.length) return [];
  const q = query(
    collection(db, "activity"),
    where("uid", "in", friendUids.slice(0, 10)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function likePost(postId: string, uid: string) {
  await updateDoc(doc(db, "activity", postId), { likes: arrayUnion(uid) });
}

export async function unlikePost(postId: string, uid: string) {
  await updateDoc(doc(db, "activity", postId), { likes: arrayRemove(uid) });
}

export async function addComment(postId: string, uid: string, userName: string, text: string) {
  const postRef = doc(db, "activity", postId);
  const postDoc = await getDoc(postRef);
  const comments = postDoc.data()?.comments ?? [];
  await updateDoc(postRef, {
    comments: [...comments, { uid, userName, text, createdAt: new Date().toISOString() }]
  });
}
