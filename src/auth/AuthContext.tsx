import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StaffProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured, api } from '../lib/supabase';
import { mockStore } from '../lib/mockData';

interface AuthContextType {
  user: StaffProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithVolunteerPhone: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; phone?: string; unit?: string }) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo staff accounts for quick testing when offline or before Supabase keys are linked
const DEMO_ACCOUNTS: Record<string, { pass: string; profile: StaffProfile }> = {
  'admin@balasangham.in': {
    pass: 'admin123',
    profile: {
      id: 'staff-admin-01',
      email: 'admin@balasangham.in',
      full_name: 'സംസ്ഥാന അഡ്മിൻ (State Admin)',
      role: 'admin',
    },
  },
  'kannur@balasangham.in': {
    pass: 'kannur123',
    profile: {
      id: 'staff-dist-02',
      email: 'kannur@balasangham.in',
      full_name: 'കണ്ണൂർ ജില്ലാ കൺവീനർ (Kannur Coordinator)',
      role: 'district',
      district_id: 2,
      district_name: 'കണ്ണൂർ',
    },
  },
  'kasaragod@balasangham.in': {
    pass: 'kasaragod123',
    profile: {
      id: 'staff-dist-01',
      email: 'kasaragod@balasangham.in',
      full_name: 'കാസർഗോഡ് ജില്ലാ കൺവീനർ (Kasaragod Coordinator)',
      role: 'district',
      district_id: 1,
      district_name: 'കാസർഗോഡ്',
    },
  },
  'volunteer@balasangham.in': {
    pass: 'volunteer123',
    profile: {
      id: 'staff-vol-03',
      email: 'volunteer@balasangham.in',
      full_name: 'രേഷ്മ പി. (ഹെൽപ്പ് ഡെസ്ക് വളണ്ടിയർ)',
      role: 'volunteer',
      district_id: 1,
      district_name: 'കാസർഗോഡ്',
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const inFlightProfileRef = useRef<Map<string, Promise<void>>>(new Map());
  const userRef = useRef<StaffProfile | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // 1. Check local session
    const saved = localStorage.getItem('sammelanam_staff_session');
    let parsedSession: StaffProfile | null = null;
    if (saved) {
      try {
        parsedSession = JSON.parse(saved);
        setUser(parsedSession);
        userRef.current = parsedSession;
      } catch (e) {
        console.warn('Failed to parse saved session', e);
        localStorage.removeItem('sammelanam_staff_session');
      }
    }

    // If local session is a Volunteer (authenticated via Phone + PIN), they do not have a Supabase Auth email/password session.
    // Preserve their session and complete loading immediately so they are not redirected away on page reload.
    if (parsedSession && parsedSession.role === 'volunteer') {
      setLoading(false);

      // Background verification: ensure volunteer still exists in DB
      if (isSupabaseConfigured && supabase && parsedSession.phone) {
        const cleanDigits = parsedSession.phone.replace(/[^0-9]/g, '');
        const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
        (async () => {
          try {
            const { data, error } = await supabase
              .from('volunteers')
              .select('id, name, phone, unit');
            if (!error && data && data.length > 0) {
              const match = data.find((v: any) => {
                const vDigits = (v.phone || '').replace(/[^0-9]/g, '');
                const vNormalized = vDigits.length >= 10 ? vDigits.slice(-10) : vDigits;
                return vNormalized === cleanPhone;
              });
              if (!match) {
                console.warn('Volunteer record no longer exists, clearing session');
                setUser(null);
                userRef.current = null;
                localStorage.removeItem('sammelanam_staff_session');
              } else if (match.name !== parsedSession!.full_name || match.unit !== parsedSession!.unit) {
                const updated: StaffProfile = {
                  ...parsedSession!,
                  full_name: match.name,
                  unit: match.unit || '',
                };
                setUser(updated);
                userRef.current = updated;
                localStorage.setItem('sammelanam_staff_session', JSON.stringify(updated));
              }
            }
          } catch (err) {
            console.warn('Volunteer background check error:', err);
          }
        })();
      }
    }

    // 2. Check Supabase session if configured (for admin / district users)
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          fetchSupabaseProfile(data.session.user.id, data.session.user.email || '');
        } else {
          // If Supabase has no active session:
          // Do NOT clear if current session is an authenticated volunteer
          if (userRef.current?.role === 'volunteer') {
            setLoading(false);
            return;
          }
          // Invalidate unauthenticated admin session
          setUser(null);
          userRef.current = null;
          localStorage.removeItem('sammelanam_staff_session');
          setLoading(false);
        }
      }).catch(() => {
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          // Only invalidate on explicit SIGNED_OUT if the user is NOT a volunteer
          if (userRef.current?.role !== 'volunteer') {
            setUser(null);
            userRef.current = null;
            localStorage.removeItem('sammelanam_staff_session');
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string, email: string): Promise<void> => {
    if (!supabase) return;

    // Redundancy elimination: If profile is already loaded for this user, skip network call
    if (userRef.current && userRef.current.id === userId && userRef.current.role) {
      setLoading(false);
      return;
    }

    // In-flight deduplication: Join pending request if getSession and onAuthStateChange fire concurrently
    const inFlight = inFlightProfileRef.current.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data) {
          const profile: StaffProfile = {
            id: data.id,
            email,
            full_name: data.full_name,
            phone: data.phone || '',
            role: data.role as UserRole,
            district_id: data.district_id,
          };
          setUser(profile);
          userRef.current = profile;
          localStorage.setItem('sammelanam_staff_session', JSON.stringify(profile));
        } else {
          // SECURITY FIX: New staff default to 'volunteer' role, NEVER 'admin'
          const fallbackProfile: StaffProfile = {
            id: userId,
            email,
            full_name: email.split('@')[0] || 'സ്റ്റാഫ് (Staff)',
            role: 'volunteer',
          };
          setUser(fallbackProfile);
          userRef.current = fallbackProfile;
          localStorage.setItem('sammelanam_staff_session', JSON.stringify(fallbackProfile));

          // Attempt background profile upsert with safe default volunteer role
          supabase
            .from('profiles')
            .upsert({
              id: userId,
              full_name: fallbackProfile.full_name,
              phone: '',
              role: 'volunteer',
            })
            .then(({ error: upsertErr }) => {
              if (upsertErr) console.warn('Background profile upsert notice:', upsertErr.message);
            });
        }
      } catch (err) {
        console.warn('Profile fetch error', err);
      } finally {
        setLoading(false);
        inFlightProfileRef.current.delete(userId);
      }
    })();

    inFlightProfileRef.current.set(userId, fetchPromise);
    return fetchPromise;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is configured, ALWAYS authenticate against live Supabase Auth first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchSupabaseProfile(data.user.id, data.user.email || '');
        return { success: true };
      }
    }

    // 2. Demo accounts ONLY active when Supabase is NOT configured (offline mock/dev mode)
    if (!isSupabaseConfigured) {
      const demo = DEMO_ACCOUNTS[cleanEmail];
      if (demo && demo.pass === password) {
        setUser(demo.profile);
        localStorage.setItem('sammelanam_staff_session', JSON.stringify(demo.profile));
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'തെറ്റായ ഇമെയിൽ അല്ലെങ്കിൽ പാസ്‌വേഡ് (Invalid email or password)',
    };
  };

  const loginWithVolunteerPhone = async (phone: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPin = pin.trim();
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        error: 'ദയവായി സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക (Please enter a valid 10-digit mobile number)',
      };
    }

    const configuredPin = import.meta.env.VITE_VOLUNTEER_PIN
      ? String(import.meta.env.VITE_VOLUNTEER_PIN).trim()
      : '';

    if (!configuredPin) {
      return {
        success: false,
        error: 'സമ്മേളന പിൻ ക്രമീകരിച്ചിട്ടില്ല. ദയവായി അഡ്മിനുമായി ബന്ധപ്പെടുക. (Conference PIN is not configured. Please contact admin.)',
      };
    }

    if (cleanPin !== configuredPin) {
      return {
        success: false,
        error: 'തെറ്റായ കോൺഫറൻസ് പിൻ (Invalid conference PIN)',
      };
    }

    // 1. Try finding the volunteer in live Supabase first
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('volunteers')
          .select('id, name, phone, unit');

        if (!error && data && data.length > 0) {
          const match = data.find((v: any) => {
            const vDigits = (v.phone || '').replace(/[^0-9]/g, '');
            const vNormalized = vDigits.length >= 10 ? vDigits.slice(-10) : vDigits;
            return vNormalized === cleanPhone;
          });

          if (match) {
            const profile: StaffProfile = {
              id: match.id || `vol-${cleanPhone}`,
              email: `${cleanPhone}@volunteer.balasangham.in`,
              full_name: match.name,
              phone: match.phone,
              unit: match.unit || '',
              role: 'volunteer',
            };
            setUser(profile);
            localStorage.setItem('sammelanam_staff_session', JSON.stringify(profile));
            return { success: true };
          }
        }
      } catch (err) {
        console.warn('Supabase volunteer phone lookup error, checking mockStore', err);
      }
    }

    // 2. Fallback: check local mockStore
    const localVolunteers = mockStore.getVolunteers();
    const localMatch = localVolunteers.find((v) => {
      const vDigits = (v.phone || '').replace(/[^0-9]/g, '');
      const vNormalized = vDigits.length >= 10 ? vDigits.slice(-10) : vDigits;
      return vNormalized === cleanPhone;
    });

    if (localMatch) {
      const profile: StaffProfile = {
        id: localMatch.id || `vol-${cleanPhone}`,
        email: `${cleanPhone}@volunteer.balasangham.in`,
        full_name: localMatch.name,
        phone: localMatch.phone,
        unit: localMatch.unit || '',
        role: 'volunteer',
      };
      setUser(profile);
      localStorage.setItem('sammelanam_staff_session', JSON.stringify(profile));
      return { success: true };
    }

    return {
      success: false,
      error: 'ഈ ഫോൺ നമ്പർ വളണ്ടിയർ ലിസ്റ്റിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല. ദയവായി അഡ്മിനുമായി ബന്ധപ്പെടുക. (Phone number not registered as volunteer)',
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    setUser(null);
    userRef.current = null;
    localStorage.removeItem('sammelanam_staff_session');
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string; unit?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updatedProfile: StaffProfile = {
      ...user,
      full_name: updates.full_name !== undefined ? updates.full_name.trim() : user.full_name,
      phone: updates.phone !== undefined ? updates.phone.trim() : user.phone,
      unit: updates.unit !== undefined ? updates.unit.trim() : user.unit,
    };

    setUser(updatedProfile);
    localStorage.setItem('sammelanam_staff_session', JSON.stringify(updatedProfile));

    // Also sync to volunteers directory if user is a volunteer
    try {
      const volList = mockStore.getVolunteers();
      const match = volList.find(
        (v) => (v.id && v.id === user.id) || v.name.toLowerCase() === user.full_name.toLowerCase() || (user.phone && v.phone === user.phone)
      );
      if (match && match.id) {
        await api.updateVolunteer({
          id: match.id,
          name: updatedProfile.full_name,
          phone: updatedProfile.phone || match.phone,
          unit: updatedProfile.unit || match.unit,
        });
      }
    } catch (e) {
      console.warn('Volunteer store sync notice', e);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, any> = {};
        if (updates.full_name !== undefined) payload.full_name = updates.full_name.trim();
        if (updates.phone !== undefined) payload.phone = updates.phone.trim();

        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', user.id);

        if (error) {
          console.warn('Supabase profile update warning:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithVolunteerPhone,
        logout,
        updateProfile,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
