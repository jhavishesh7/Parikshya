import { create } from 'zustand';
import { supabase, Profile } from '../lib/supabase';

interface AuthState {
  user: any;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, examType: 'IOE' | 'CEE') => Promise<any>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.user) {
      set({ user: data.user, loading: false });
      // Fetch profile in background to avoid blocking UI
      get().fetchProfile();
    } else {
      set({ loading: false });
    }
    return { data, error };
  },

  signUp: async (email: string, password: string, fullName: string, examType: 'IOE' | 'CEE') => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Always try to create a profile row if user exists in session
    let userId = data.user?.id;
    if (!userId && data.session?.user) userId = data.session.user.id;
    if (userId) {
      // Always set role to 'student' on signup
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            email,
            full_name: fullName,
            exam_type: examType,
            role: 'student',
          },
        ]);
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    set({ loading: false });
    return { data, error };
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ loading: false });
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error && profile) {
        set({ profile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { profile } = get();
    if (!profile) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (data && !error) {
      set({ profile: data });
    }
  },
}));

// Initialize auth state with better error handling
let authInitialized = false;

const initializeAuth = async () => {
  if (authInitialized) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      useAuthStore.setState({ user, loading: false });
      // Fetch profile in background
      setTimeout(() => useAuthStore.getState().fetchProfile(), 100);
    } else {
      useAuthStore.setState({ user: null, profile: null, loading: false });
    }
  } catch (error) {
    console.error('Auth initialization error:', error);
    useAuthStore.setState({ user: null, profile: null, loading: false });
  } finally {
    authInitialized = true;
  }
};

// Initialize auth state
initializeAuth();

// Optimized auth state change handler
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    useAuthStore.setState({ user: session.user, loading: false });
    // Fetch profile in background
    setTimeout(() => useAuthStore.getState().fetchProfile(), 100);
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, loading: false });
  }
});