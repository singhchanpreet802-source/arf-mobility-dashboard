import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

function roleStorageKey(uid) {
  return `arf_selected_role_${uid}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data());
          } else {
            setProfile({ name: firebaseUser.email });
          }
        } catch {
          setProfile({ name: firebaseUser.email });
        }
        // The role for this dashboard is chosen by the person at sign-in time
        // ("ARF Member" vs "Municipal Officer") rather than fixed in their
        // account record — remember the choice for this browser session only.
        try {
          const stored = sessionStorage.getItem(roleStorageKey(firebaseUser.uid));
          setSelectedRole(stored === 'observer' || stored === 'official' ? stored : null);
        } catch {
          setSelectedRole(null);
        }
      } else {
        setProfile(null);
        setSelectedRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const chooseRole = (role) => {
    if (role !== 'observer' && role !== 'official') return;
    if (user) {
      try {
        sessionStorage.setItem(roleStorageKey(user.uid), role);
      } catch {
        // sessionStorage unavailable — selection still works for this render
      }
    }
    setSelectedRole(role);
  };

  const logout = () => {
    if (user) {
      try {
        sessionStorage.removeItem(roleStorageKey(user.uid));
      } catch {
        // ignore
      }
    }
    setSelectedRole(null);
    return signOut(auth);
  };

  const value = {
    user,
    profile,
    role: selectedRole,
    name: profile?.name ?? user?.email ?? '',
    isObserver: selectedRole === 'observer',
    isOfficial: selectedRole === 'official',
    loading,
    login,
    logout,
    chooseRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
