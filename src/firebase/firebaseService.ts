import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  handleFirestoreError,
  OperationType,
  User,
} from './config';
import { ChatMessage, EvaluationResult, WhiteboardNode } from '../types/interview';

export interface SavedSessionSummary {
  id: string;
  userId: string;
  scenario: string;
  overallScore: number;
  hiringDecision: string;
  durationSeconds: number;
  messagesCount: number;
  createdAt: string;
}

export interface SavedSessionDetail {
  id: string;
  userId: string;
  messages: ChatMessage[];
  whiteboardNodes: WhiteboardNode[];
  architectureNotes: string;
  evaluationResult: EvaluationResult | null;
  createdAt: string;
}

// Sign In with Google Popup
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Persist/Update user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          displayName: user.displayName || 'Candidate',
          email: user.email || '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }

    return user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

// Logout
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Save Completed Mock Interview Session
export async function saveInterviewToFirestore(
  userId: string,
  scenario: string,
  durationSeconds: number,
  messages: ChatMessage[],
  whiteboardNodes: WhiteboardNode[],
  architectureNotes: string,
  evaluationResult: EvaluationResult | null
): Promise<string> {
  const sessionId = `session-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const summaryData: SavedSessionSummary = {
    id: sessionId,
    userId,
    scenario,
    overallScore: evaluationResult?.overallScore || 0,
    hiringDecision: evaluationResult?.hiringDecision || 'Pending',
    durationSeconds,
    messagesCount: messages.length,
    createdAt,
  };

  const detailData: SavedSessionDetail = {
    id: sessionId,
    userId,
    messages,
    whiteboardNodes,
    architectureNotes,
    evaluationResult,
    createdAt,
  };

  // Write summary card
  const summaryPath = `users/${userId}/sessions/${sessionId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId), summaryData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, summaryPath);
  }

  // Write full detail
  const detailPath = `users/${userId}/session_details/${sessionId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'session_details', sessionId), detailData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, detailPath);
  }

  return sessionId;
}

// Fetch Full Session Details
export async function fetchSessionDetail(
  userId: string,
  sessionId: string
): Promise<SavedSessionDetail | null> {
  const path = `users/${userId}/session_details/${sessionId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'session_details', sessionId));
    if (!snap.exists()) return null;
    return snap.data() as SavedSessionDetail;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Delete Session
export async function deleteSessionFromFirestore(
  userId: string,
  sessionId: string
): Promise<void> {
  const summaryPath = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, summaryPath);
  }

  const detailPath = `users/${userId}/session_details/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'session_details', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, detailPath);
  }
}

// Real-time listener for user's past interview sessions
export function subscribeToUserSessions(
  userId: string,
  onData: (sessions: SavedSessionSummary[]) => void
): () => void {
  const path = `users/${userId}/sessions`;
  const sessionsCol = collection(db, 'users', userId, 'sessions');

  const unsubscribe = onSnapshot(
    sessionsCol,
    (snapshot) => {
      const items: SavedSessionSummary[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SavedSessionSummary);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}
