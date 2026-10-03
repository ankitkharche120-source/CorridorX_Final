/**
 * Notification Service
 * Modular client notification dispatcher supporting HTML5 Browser Notifications,
 * sound alerts, and extensible push integrations.
 */

class NotificationService {
  constructor() {
    this.permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    this.audioAlert = null;
  }

  /**
   * Request browser notification permission
   */
  async requestPermission() {
    if (typeof Notification === 'undefined') {
      console.warn('[NotificationService] Web notifications not supported on this platform.');
      return 'unsupported';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch (e) {
      console.warn('[NotificationService] Permission request failed:', e);
      return 'denied';
    }
  }

  /**
   * Show notification with optional sound alert
   */
  show(title, options = {}) {
    // 1. Play emergency chime if enabled
    if (options.playSound !== false) {
      this.playChime(options.soundType || 'emergency');
    }

    // 2. Dispatch system notification if granted
    if (this.permission === 'granted' && typeof Notification !== 'undefined') {
      try {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          body: options.body || '',
          tag: options.tag || 'corridorx-emergency',
          renotify: true,
          requireInteraction: options.priority === 'HIGH',
          ...options
        });

        if (options.onClick) {
          notif.onclick = options.onClick;
        }

        return notif;
      } catch (err) {
        console.warn('[NotificationService] Notification dispatch failed:', err);
      }
    }

    return null;
  }

  /**
   * Synthesize audio frequency chime using Web Audio API (zero audio file dependencies)
   */
  playChime(type = 'emergency') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'emergency') {
        // High-low medical alert tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(440, now + 0.15); // A4
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Pleasant confirmation ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio autoplay policy might block before first user interaction, safely ignore
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
