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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.user) {
      set({ user: data.user });
      await get().fetchProfile();
    }
    return { data, error };
  },

  signUp: async (email: string, password: string, fullName: string, examType: 'IOE' | 'CEE') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

  // Always try to create a profile row if user exists in session
  let userId = data.user?.id;
  // session variable is not used
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

    return { data, error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      console.log('Fetched profile:', profile, 'Error:', error, 'User:', user);
      set({ user, profile, loading: false });
    } else {
      set({ user: null, profile: null, loading: false });
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

// Initialize auth state
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    useAuthStore.getState().fetchProfile();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, loading: false });
  }
});

// Fetch initial auth state
useAuthStore.getState().fetchProfile();