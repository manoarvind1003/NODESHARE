import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Error fetching session:', error);
                    if (mounted) setLoading(false);
                    return;
                }

                if (session) {
                    if (mounted) {
                        setSession(session);
                        setUser(session.user);
                        await fetchProfile(session.user.id);
                    }
                } else {
                    if (mounted) setLoading(false);
                }
            } catch (err) {
                console.error('Unexpected session error:', err);
                if (mounted) setLoading(false);
            }
        }

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                // When the user is in the PASSWORD_RECOVERY flow, we should NOT
                // update the main auth state — the UpdatePassword page handles this
                // independently. Setting user state here would cause redirect loops.
                if (event === 'PASSWORD_RECOVERY') {
                    // Don't update user/session state — let UpdatePassword handle it
                    return;
                }

                setSession(newSession);
                setUser(newSession?.user || null);

                if (newSession?.user) {
                    await fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // If profile not found (new user not yet in DB), don't crash
                if (error.code === 'PGRST116') {
                    // No profile found — user may have been deleted or profile not created yet
                    setProfile(null);
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, username, fullName) => {
        return supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    full_name: fullName
                }
            }
        });
    };

    const signIn = async (email, password) => {
        return supabase.auth.signInWithPassword({
            email,
            password
        });
    };

    const signOut = async () => {
        return supabase.auth.signOut();
    };

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    const isSuperAdmin = profile?.role === 'super_admin';

    const value = {
        session,
        user,
        profile,
        loading,
        isAdmin,
        isSuperAdmin,
        signUp,
        signIn,
        signOut,
        refreshProfile: () => user && fetchProfile(user.id)
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
