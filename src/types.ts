export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  url: string; // Data URL or object URL
  name: string;
  size?: number; // Size in bytes
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: number; // milliseconds timestamp for consistent sorting and rendering
  isOptimistic?: boolean;
  isRead?: boolean;
  readBy?: string[];
  reactions?: string[];
  avatarId?: string;
  attachment?: ChatAttachment;
  replyTo?: {
    userName: string;
    snippet: string;
  };
}

export interface SystemNotification {
  id: string;
  type?: 'join' | 'leave';
  userName?: string;
  text: string;
  timestamp: number;
}

export interface UserPresence {
  sessionId: string;
  userName: string;
  connectedAt: any;
  lastSeen: any;
  lastReadAt?: any;
  avatarId?: string;
}

export interface TypingUser {
  sessionId: string;
  userName: string;
  lastTyped: number;
}

