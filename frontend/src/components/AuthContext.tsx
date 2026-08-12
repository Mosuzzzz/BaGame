'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, getRedirectResult, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  showOnlyFavs: boolean;
  setShowOnlyFavs: (favs: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  useEffect(() => {
    // Check for redirect result first to handle domain validation
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const email = result.user.email || '';
        if (!email.endsWith('rmuti.ac.th')) {
          await fbSignOut(auth);
          alert('กรุณาใช้บัญชีอีเมลของมหาวิทยาลัย (เช่น @rmuti.ac.th) เพื่อเข้าสู่ระบบ');
        }
      }
    }).catch(err => console.warn('Redirect result error:', err));

    // 2. Otherwise listen to real Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Double check domain on auth state change just to be safe
          const email = currentUser.email || '';
          if (!email.endsWith('rmuti.ac.th')) {
            await fbSignOut(auth);
            setToken(null);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          const jwtToken = await currentUser.getIdToken();
          setToken(jwtToken);
          
          // Check if admin
          const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
          setIsAdmin(adminEmails.includes(currentUser.email?.toLowerCase() || ''));
        } catch (err) {
          console.error('Error fetching Firebase ID token:', err);
          setToken(null);
          setIsAdmin(false);
        }
      } else {
        setToken(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      // Optional UI hint for Google to prefer rmuti.ac.th and force account selection
      googleProvider.setCustomParameters({ 
        hd: 'rmuti.ac.th',
        prompt: 'select_account' 
      });
      
      // Set persistence to in-memory to prevent IndexedDB closing/hidden errors in sandboxes
      await setPersistence(auth, inMemoryPersistence);
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // Strict verification (Only allow RMUTI)
      const email = result.user.email || '';
      if (!email.endsWith('rmuti.ac.th')) {
        await fbSignOut(auth); // Sign them back out
        alert('กรุณาใช้บัญชีอีเมลของมหาวิทยาลัย (เช่น @rmuti.ac.th) เพื่อเข้าสู่ระบบ');
        throw new Error('Unauthorized domain');
      }

      const jwtToken = await result.user.getIdToken();
      setToken(jwtToken);
    } catch (error: any) {
      if (error.message !== 'Unauthorized domain') {
        console.warn('Google Sign-In popup failed:', error);
      }
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await fbSignOut(auth).catch(() => {});
      setUser(null);
      setToken(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isMenuOpen, setIsMenuOpen, showOnlyFavs, setShowOnlyFavs, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
