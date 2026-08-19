import { supabase, isSupabaseConfigured } from './supabaseClient';

export const userService = {
  /**
   * Fetch profile for a specific user ID
   */
  async getProfile(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[GitPilot Cloud] getProfile error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[GitPilot Cloud] getProfile failed:', err);
      return null;
    }
  },

  /**
   * Ensure or create profile row if trigger didn't catch it
   */
  async ensureProfile({ id, email, displayName }) {
    if (!isSupabaseConfigured() || !supabase || !id) {
      return null;
    }

    try {
      const existing = await this.getProfile(id);
      if (existing) return existing;

      const newProfile = {
        id,
        email,
        display_name: displayName || email?.split('@')[0] || 'Developer',
        status: 'active',
        plan: 'free',
        role: 'user',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.warn('[GitPilot Cloud] ensureProfile insert error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[GitPilot Cloud] ensureProfile failed:', err);
      return null;
    }
  },

  /**
   * Update self profile permitted fields (e.g. display_name)
   */
  async updateProfile(userId, updates) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return { success: false, error: 'Cloud service unavailable' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          last_active: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return;
    }

    try {
      await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      // Non-critical, ignore silent failure
    }
  },

  // ==========================================================
  // OWNER / ADMIN FUNCTIONS (Enforced by Supabase RLS policies)
  // ==========================================================

  /**
   * Admin: List all users with optional search and filters
   */
  async getAllUsers({ search = '', status = 'all', plan = 'all', limit = 100 } = {}) {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, users: [], error: 'Supabase not configured' };
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (plan && plan !== 'all') {
        query = query.eq('plan', plan);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`email.ilike.${term},display_name.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) {
        return { success: false, users: [], error: error.message };
      }
      return { success: true, users: data || [] };
    } catch (err) {
      return { success: false, users: [], error: err.message };
    }
  },

  /**
   * Admin: Update user status ('active', 'suspended', 'deleted')
   */
  async updateUserStatus(userId, status) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Admin: Update user plan ('free', 'pro', 'lifetime')
   */
  async updateUserPlan(userId, plan) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ plan })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Admin: Delete user profile
   */
  async deleteProfile(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Admin: Aggregate statistics
   */
  async getAdminStats() {
    if (!isSupabaseConfigured() || !supabase) {
      return { total: 0, active: 0, suspended: 0, pro: 0, free: 0, lifetime: 0 };
    }

    try {
      const { data, error } = await supabase.from('profiles').select('status, plan, role, created_at');
      if (error || !data) {
        return { total: 0, active: 0, suspended: 0, pro: 0, free: 0, lifetime: 0 };
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: data.length,
        active: data.filter((u) => u.status === 'active').length,
        suspended: data.filter((u) => u.status === 'suspended').length,
        newUsers: data.filter((u) => new Date(u.created_at) > thirtyDaysAgo).length,
        free: data.filter((u) => u.plan === 'free').length,
        pro: data.filter((u) => u.plan === 'pro').length,
        lifetime: data.filter((u) => u.plan === 'lifetime').length,
      };

      return stats;
    } catch (err) {
      return { total: 0, active: 0, suspended: 0, pro: 0, free: 0, lifetime: 0 };
    }
  },
};
