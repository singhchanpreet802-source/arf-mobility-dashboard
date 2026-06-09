import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { JUNCTION, BASELINE_OBSERVATION } from './baseline';

export const OBSERVATIONS_COL = 'observations';
export const ALERTS_COL = 'alerts';
export const SCHOOLS_COL = 'schools';

function logSubscriptionError(label, err) {
  // Surfaces Firestore errors (e.g. missing index, permission-denied) instead of
  // letting onSnapshot fail silently and leave the UI stuck on "Loading…".
  // eslint-disable-next-line no-console
  console.error(`[ARF] ${label} subscription error:`, err);
}

export function subscribeObservations(junctionId, cb, onError) {
  // NOTE: deliberately filtering only (no server-side orderBy) — combining an
  // equality filter with orderBy on a different field requires a Firestore
  // composite index. We sort client-side instead, which avoids that entirely.
  const q = query(collection(db, OBSERVATIONS_COL), where('junctionId', '==', junctionId));
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Always ensure baseline is present (locked, pre-loaded).
      if (!docs.some((d) => d.isBaseline)) {
        docs.unshift({ ...BASELINE_OBSERVATION });
      }
      docs.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
      cb(docs);
    },
    (err) => {
      logSubscriptionError('observations', err);
      // Fall back to baseline-only data so the dashboard still renders.
      cb([{ ...BASELINE_OBSERVATION }]);
      onError?.(err);
    }
  );
}

export function subscribeAllObservations(cb, onError) {
  const q = query(collection(db, OBSERVATIONS_COL), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      logSubscriptionError('all observations', err);
      cb([]);
      onError?.(err);
    }
  );
}

export async function addObservation(observation) {
  return addDoc(collection(db, OBSERVATIONS_COL), {
    ...observation,
    junctionId: JUNCTION.id,
    isBaseline: false,
    locked: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeAlerts(cb, onError) {
  const q = query(collection(db, ALERTS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      logSubscriptionError('alerts', err);
      cb([]);
      onError?.(err);
    }
  );
}

export async function createAlert(alert) {
  return addDoc(collection(db, ALERTS_COL), {
    ...alert,
    dismissed: false,
    createdAt: serverTimestamp(),
  });
}

export async function dismissAlert(alertId) {
  return updateDoc(doc(db, ALERTS_COL, alertId), { dismissed: true });
}

export function subscribeSchools(cb, onError) {
  const q = query(collection(db, SCHOOLS_COL), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      logSubscriptionError('schools', err);
      cb([]);
      onError?.(err);
    }
  );
}

export async function addSchool(school) {
  return addDoc(collection(db, SCHOOLS_COL), {
    ...school,
    createdAt: serverTimestamp(),
  });
}
