import { create } from 'zustand';
import { authService, userService, deviceService, isSupabaseConfigured } from '../services/cloud';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  devices: [],
  isAuthenticated: false,
  isAdmin: false,
  isSuspended: false,
  isLoading: true,
  isInitialized: false,
  isCloudConfigured: isSupabaseConfigured(),
  error: null,

  /**
   * Initialize authentication on app startup
   */
  initializeAuth: async () => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured()) {
      set({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isAdmin: false,
        isSuspended: false,
        isLoading: false,
        isInitialized: true,
        isCloudConfigured: false,
      });
      return;
    }

    try {
      const session = await authService.getSession();
      if (session?.user) {
        const user = session.user;
        let profile = await userService.getProfile(user.id);

        if (!profile) {
          profile = await userService.ensureProfile({
            id: user.id,
            email: user.email,
            displayName: user.user_metadata?.display_name,
          });
        }

        const isSuspended = profile?.status === 'suspended';
        const isAdmin = profile?.role === 'admin';

        // Update last active and register device if not suspended
        if (!isSuspended) {
          await userService.updateLastActive(user.id);
          await deviceService.registerOrUpdateDevice(user.id, '1.1.0');
        }

        const devices = await deviceService.getUserDevices(user.id);

        set({
          user,
          session,
          profile,
          devices,
          isAuthenticated: true,
          isAdmin,
          isSuspended,
          isLoading: false,
          isInitialized: true,
          isCloudConfigured: true,
        });
      } else {
        set({
          user: null,
          session: null,
          profile: null,
          devices: [],
          isAuthenticated: false,
          isAdmin: false,
          isSuspended: false,
          isLoading: false,
          isInitialized: true,
          isCloudConfigured: true,
        });
      }

      // Listen for background auth state changes
      authService.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          set({
            user: null,
            session: null,
            profile: null,
            devices: [],
            isAuthenticated: false,
            isAdmin: false,
            isSuspended: false,
            isLoading: false,
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = newSession.user;
          const profile = await userService.getProfile(user.id);
          set({
            user,
            session: newSession,
            profile,
            isAuthenticated: true,
            isAdmin: profile?.role === 'admin',
            isSuspended: profile?.status === 'suspended',
          });
        }
      });
    } catch (err) {
      console.warn('[GitPilot Auth] Auth init error:', err);
      set({
        isLoading: false,
        isInitialized: true,
        error: err.message,
      });
    }
  },

  /**
   * Log in with email and password
   */
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    const res = await authService.signIn({ email, password });

    if (!res.success) {
      set({ isLoading: false, error: res.error });
      return { success: false, error: res.error };
    }

    const user = res.user;
    let profile = await userService.getProfile(user.id);
    if (!profile) {
      profile = await userService.ensureProfile({
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name,
      });
    }

    const isSuspended = profile?.status === 'suspended';
    const isAdmin = profile?.role === 'admin';

    if (!isSuspended) {
      await userService.updateLastActive(user.id);
      await deviceService.registerOrUpdateDevice(user.id, '1.1.0');
    }

    const devices = await deviceService.getUserDevices(user.id);

    set({
      user,
      session: res.session,
      profile,
      devices,
      isAuthenticated: true,
      isAdmin,
      isSuspended,
      isLoading: false,
      error: null,
    });

    return { success: true, user, profile, isSuspended };
  },

  /**
   * Register new account
   */
  register: async ({ email, password, displayName }) => {
    set({ isLoading: true, error: null });
    const res = await authService.signUp({ email, password, displayName });

    if (!res.success) {
      set({ isLoading: false, error: res.error });
      return { success: false, error: res.error };
    }

    const user = res.user;
    let profile = null;
    let devices = [];

    if (user && res.session) {
      profile = await userService.ensureProfile({
        id: user.id,
        email: user.email,
        displayName,
      });
      await deviceService.registerOrUpdateDevice(user.id, '1.1.0');
      devices = await deviceService.getUserDevices(user.id);
    }

    set({
      user: res.user || null,
      session: res.session || null,
      profile,
      devices,
      isAuthenticated: Boolean(res.session),
      isAdmin: false,
      isSuspended: false,
      isLoading: false,
      error: null,
    });

    return {
      success: true,
      user: res.user,
      requiresEmailVerification: !res.session,
    };
  },

  /**
   * Log out
   */
  logout: async () => {
    set({ isLoading: true });
    await authService.signOut();
    set({
      user: null,
      session: null,
      profile: null,
      devices: [],
      isAuthenticated: false,
      isAdmin: false,
      isSuspended: false,
      isLoading: false,
      error: null,
    });
    return { success: true };
  },

  /**
   * Send password reset email
   */
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    const res = await authService.resetPasswordForEmail(email);
    set({ isLoading: false, error: res.error || null });
    return res;
  },

  /**
   * Refresh profile and device list
   */
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const profile = await userService.getProfile(user.id);
    const devices = await deviceService.getUserDevices(user.id);

    set({
      profile,
      devices,
      isAdmin: profile?.role === 'admin',
      isSuspended: profile?.status === 'suspended',
    });
  },

  /**
   * Update display name
   */
  updateDisplayName: async (displayName) => {
    const { user, profile } = get();
    if (!user) return { success: false, error: 'Not logged in' };

    const res = await userService.updateProfile(user.id, { display_name: displayName });
    if (res.success) {
      set({ profile: { ...profile, display_name: displayName } });
    }
    return res;
  },

  clearError: () => set({ error: null }),
}));
