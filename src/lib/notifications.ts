/**
 * Comprehensive System, Mobile OS & In-App Notification Engine for Banter
 *
 * Implements:
 * - Real Native Mobile/Desktop OS System Notifications (W3C Notification API & Service Worker)
 * - Authentic Apple Crystal Audio Chimes (Web Audio API, offline, zero-latency)
 * - Mobile Haptic Vibration Patterns (navigator.vibrate)
 * - Differentiated Notification Content:
 *   * Friends: Displays the REAL, literal message with friend badge & name.
 *   * Simple Banter Chats: Displays an engaging, grammatically polished alert
 *     stating that chats are happening on Banter and inviting the user to join.
 * - Both Online & Exited/Minimized Support: Native OS alerts fire in both states.
 * - Background Service Worker Notification Delivery & Window Focus
 */

import { ChatMessage } from '../types';

let audioCtx: AudioContext | null = null;
let titleFlashInterval: NodeJS.Timeout | null = null;
let originalTitle = typeof document !== 'undefined' ? document.title : 'Banter • Live Chat';

// Ensure AudioContext is initialized safely on user action
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play authentic Apple-style crystal sound chime
 */
export function playNotificationChime(type: 'message' | 'direct' | 'friend_request' = 'message'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'direct' || type === 'friend_request') {
      // 3-tone bright harmonic chime (C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } else {
      // 2-tone clean bell chime (F5 -> A5)
      const notes = [698.46, 880.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.34);
      });
    }
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

/**
 * Mobile Haptic Vibration Pattern
 */
export function triggerNotificationVibrate(type: 'message' | 'direct' | 'friend_request' = 'message'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    if (type === 'direct') {
      // Double urgent tap for friends & direct messages
      navigator.vibrate([120, 80, 160]);
    } else if (type === 'friend_request') {
      // Ascending triple tap
      navigator.vibrate([80, 60, 100, 60, 150]);
    } else {
      // Gentle double pulse for room banter
      navigator.vibrate([100, 50, 100]);
    }
  } catch {}
}

/**
 * Check if System Notifications are supported in this browser
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Get current system notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Register Service Worker for background notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Request system notification permission from browser/OS
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    // Initiate service worker in background
    registerServiceWorker().catch(() => {});
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Clean snippet formatting helper
 */
function cleanTextSnippet(text: string, maxLen: number = 75): string {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.substring(0, maxLen - 3).trim() + '...';
}

/**
 * Format notification content with strict requirement compliance:
 * - If FRIEND or DIRECT message: Displays the REAL, actual message verbatim.
 * - If SIMPLE CHATS (public room / non-friend): Displays that active chats are happening
 *   on Banter written with proper, engaging grammar and an invitation to join.
 */
export function formatMessageNotification(
  message: ChatMessage,
  currentUserId: string,
  isFriend: boolean = false,
  context?: {
    isDirect?: boolean;
    partnerName?: string;
    groupName?: string;
  }
): { title: string; body: string; tag: string } {
  const senderName = message.userName || 'Someone';
  const isDirect = !!context?.isDirect;

  // Case 1: Friend OR Direct 1-on-1 Message -> Show the REAL message
  if (isFriend || isDirect) {
    let realMessageText = '';

    if (message.attachment) {
      if (message.attachment.type === 'image') {
        realMessageText = message.message
          ? `📷 Photo: "${message.message}"`
          : '📷 Sent a photo';
      } else if (message.attachment.type === 'audio') {
        realMessageText = '🎙️ Sent a voice note';
      } else {
        realMessageText = `📎 Shared a file: "${message.attachment.name}"`;
      }
    } else if (message.replyTo) {
      realMessageText = `↩️ Replying to ${message.replyTo.userName}: "${message.message}"`;
    } else if (message.message) {
      realMessageText = `"${cleanTextSnippet(message.message, 100)}"`;
    } else {
      realMessageText = 'Sent a message';
    }

    let title = '';
    if (isDirect) {
      title = isFriend
        ? `🌟 ${senderName} (Friend)`
        : `💬 ${senderName} • Direct Message`;
    } else if (context?.groupName) {
      title = isFriend
        ? `🌟 ${senderName} (Friend) • ${context.groupName}`
        : `${senderName} in ${context.groupName}`;
    } else {
      title = `🌟 ${senderName} (Friend)`;
    }

    const tag = `friend_${message.userId}_${Date.now()}`;
    return { title, body: realMessageText, tag };
  }

  // Case 2: Simple chats happening on Banter (public room / banter chatter)
  // Formatted with proper grammar: indicates chats are taking place on Banter & invites user!
  const title = context?.groupName
    ? `Banter • ${context.groupName}`
    : 'Banter • Live Chat';

  let body = '';
  if (message.attachment) {
    if (message.attachment.type === 'image') {
      body = `Chats are happening on Banter! ${senderName} just shared a photo. Would you like to join the banter?`;
    } else if (message.attachment.type === 'audio') {
      body = `Chats are happening on Banter! ${senderName} recorded a voice note. Would you like to join the banter?`;
    } else {
      body = `Chats are happening on Banter! ${senderName} shared a file: "${message.attachment.name}". Jump in to join the conversation.`;
    }
  } else if (message.message && message.message.trim().length > 0) {
    const snippet = cleanTextSnippet(message.message, 55);
    body = `Chats are happening on Banter right now! ${senderName} says: "${snippet}" — Would you like to join the banter?`;
  } else {
    body = `Active conversations are happening on Banter right now! Jump into the room to join the banter.`;
  }

  const tag = `banter_chat_${Date.now()}`;
  return { title, body, tag };
}

/**
 * Trigger Real System/Mobile OS Notification (via Service Worker or Notification API)
 */
export async function sendSystemNotification(params: {
  title: string;
  body: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
}): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const { title, body, tag, data, onClick } = params;
  const icon = '/favicon.svg';
  const badge = '/favicon.svg';
  const notificationTag = tag || `banter_${Date.now()}`;

  try {
    // 1. Prefer Service Worker registration for mobile lockscreen & background reliability
    if ('serviceWorker' in navigator) {
      try {
        const swReadyPromise = navigator.serviceWorker.ready;
        // Wait up to 600ms for ready service worker
        const reg = await Promise.race([
          swReadyPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 600)),
        ]);

        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon,
            badge,
            tag: notificationTag,
            data: data || { url: '/' },
            renotify: true,
            vibrate: [200, 100, 200],
          } as any);
          return true;
        }
      } catch (swErr) {
        console.warn('Service worker notification failed, using native window fallback:', swErr);
      }
    }

    // 2. Direct Window Notification fallback
    const notif = new Notification(title, {
      body,
      icon,
      badge,
      tag: notificationTag,
      data: data || { url: '/' },
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
      if (onClick) onClick();
    };

    return true;
  } catch (err) {
    console.warn('System notification error:', err);
    return false;
  }
}

/**
 * Flash Browser Tab Title when user is in another tab or minimized
 */
export function flashTabTitleAlert(senderName: string, snippet: string): void {
  if (typeof document === 'undefined') return;

  // Only flash if document is currently hidden (user is in another tab / exited view)
  if (!document.hidden) return;

  if (titleFlashInterval) {
    clearInterval(titleFlashInterval);
  }

  const cleanSnippet = cleanTextSnippet(snippet, 22);
  const alertTitle = `(1) 💬 ${senderName}: ${cleanSnippet}`;
  let isAlert = true;

  originalTitle = document.title.includes('(1)') ? 'Banter • Live Chat' : document.title;

  titleFlashInterval = setInterval(() => {
    document.title = isAlert ? alertTitle : originalTitle;
    isAlert = !isAlert;
  }, 1000);

  // Clear immediately on window focus
  const clearOnFocus = () => {
    if (titleFlashInterval) {
      clearInterval(titleFlashInterval);
      titleFlashInterval = null;
    }
    document.title = originalTitle;
    window.removeEventListener('focus', clearOnFocus);
  };

  window.addEventListener('focus', clearOnFocus);
}

/**
 * Clear Tab Title Alert
 */
export function clearTabTitleAlert(): void {
  if (typeof document === 'undefined') return;
  if (titleFlashInterval) {
    clearInterval(titleFlashInterval);
    titleFlashInterval = null;
  }
  document.title = 'Banter — Talk. Laugh. Banter.';
}

/**
 * Instant Interactive Test Notification Triggers
 * Enables users to test both Friend notifications (real message)
 * and Simple Banter Chat notifications (proper grammar banter prompt)
 */
export async function triggerTestNotification(
  type: 'friend' | 'banter',
  onAction?: () => void
): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const granted = await requestNotificationPermission();
    if (granted !== 'granted') return false;
  }

  playNotificationChime(type === 'friend' ? 'direct' : 'message');
  triggerNotificationVibrate(type === 'friend' ? 'direct' : 'message');

  if (type === 'friend') {
    return sendSystemNotification({
      title: '🌟 Alex (Friend)',
      body: '"Hey! Are you free to chat right now? Let\'s catch up on Banter!"',
      tag: `test_friend_${Date.now()}`,
      onClick: () => {
        window.focus();
        onAction?.();
      },
    });
  } else {
    return sendSystemNotification({
      title: 'Banter • Live Chat',
      body: 'Chats are happening on Banter right now! Jordan says: "Anyone watching the game tonight?" — Would you like to join the banter?',
      tag: `test_banter_${Date.now()}`,
      onClick: () => {
        window.focus();
        onAction?.();
      },
    });
  }
}
