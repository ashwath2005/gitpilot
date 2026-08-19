import { supabase, isSupabaseConfigured } from './supabaseClient';

export const authService = {
  /**
   * Register a new user with email, password, and display name
   */
  async signUp({ email, password, displayName }) {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'GitPilot Cloud is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  /**
   * Log in user with email and password
   */
  async signIn({ email, password }) {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'GitPilot Cloud is not configured.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  /**
   * Log out current user
   */
  async signOut() {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Trigger password reset email
   */
  async resetPasswordForEmail(email) {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'GitPilot Cloud is not configured.',
      };
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Password reset request failed' };
    }
  },

  /**
   * Get active session
   */
  async getSession() {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch (err) {
      console.warn('[GitPilot Cloud] getSession error:', err);
      return null;
    }
  },

  /**
   * Get current authenticated user
   */
  async getUser() {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (err) {
      console.warn('[GitPilot Cloud] getUser error:', err);
      return null;
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured() || !supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  },
};
