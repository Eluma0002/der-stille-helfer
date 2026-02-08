import { createContext, useContext, useState, useEffect } from 'react';
import { ensureProfileExists } from '../db/schema';

const UserContext = createContext(undefined);
const STORAGE_KEY = 'derStilleHelfer_activeUser';

// User definitions (fixed for this 2-person household)
export const USERS = {
  elvis: {
    id: 'elvis',
    name: 'Elvis',
    emoji: '\u{1F9D1}\u200D\u{1F373}',
    accentColor: '#3b82f6',
    accentLight: '#dbeafe'
  },
  alberina: {
    id: 'alberina',
    name: 'Alberina',
    emoji: '\u{1F469}',
    accentColor: '#ec4899',
    accentLight: '#fce7f3'
  }
};

export function UserProvider({ children }) {
  const [activeUserId, setActiveUserId] = useState(() => {
    // Lazy initialization from localStorage
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      // Safari private mode or localStorage unavailable
      return null;
    }
  });

  const activeUser = activeUserId ? USERS[activeUserId] : null;

  // Persist to localStorage and ensure profile exists
  useEffect(() => {
    if (activeUserId) {
      try {
        localStorage.setItem(STORAGE_KEY, activeUserId);
      } catch (e) {
        console.warn('Could not save user preference');
      }
      // Ensure profile exists with dietary_restrictions
      ensureProfileExists(activeUserId);
    }
  }, [activeUserId]);

  // Apply theme colors
  useEffect(() => {
    const root = document.documentElement;
    if (activeUser) {
      root.style.setProperty('--accent-color', activeUser.accentColor);
      root.style.setProperty('--accent-light', activeUser.accentLight);
    }
  }, [activeUser]);

  const switchUser = (userId) => {
    setActiveUserId(userId);
  };

  return (
    <UserContext.Provider value={{
      activeUserId,
      activeUser,
      switchUser,
      isFirstRun: !activeUserId,
      users: USERS
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
