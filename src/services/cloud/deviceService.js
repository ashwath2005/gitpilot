import { supabase, isSupabaseConfigured } from './supabaseClient';
import { APP_VERSION } from '../../config/version';

const DEVICE_STORAGE_KEY = 'gitpilot_device_id';

export const deviceService = {
  /**
   * Get existing local device ID or generate a new persistent random UUID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    }
    return deviceId;
  },

  /**
   * Get basic non-invasive OS/Device descriptor
   */
  getDeviceMetadata() {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let os = 'Windows';
    let osVersion = '10/11';

    if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) {
      os = 'macOS';
      osVersion = '';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
      osVersion = '';
    }

    return {
      deviceName: `${os} PC`,
      os,
      osVersion,
      appVersion: APP_VERSION,
    };
  },

  /**
   * Register or update the device record for the authenticated user
   */
  async registerOrUpdateDevice(userId, appVersion = APP_VERSION) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return null;
    }

    const deviceId = this.getOrCreateDeviceId();
    const meta = this.getDeviceMetadata();

    try {
      const payload = {
        user_id: userId,
        device_id: deviceId,
        device_name: meta.deviceName,
        os: meta.os,
        os_version: meta.osVersion,
        app_version: appVersion,
        last_seen: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('devices')
        .upsert(payload, { onConflict: 'user_id, device_id' })
        .select()
        .single();

      if (error) {
        console.warn('[GitPilot Cloud] device upsert error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[GitPilot Cloud] device upsert failed:', err);
      return null;
    }
  },

  /**
   * Get devices registered for the current user
   */
  async getUserDevices(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });

      if (error) {
        console.warn('[GitPilot Cloud] getUserDevices error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Admin: Get all devices or devices for a specific user
   */
  async getAllDevices(userId = null) {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      let query = supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[GitPilot Cloud] getAllDevices error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      return [];
    }
  },
};
