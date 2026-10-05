export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: number; // milliseconds timestamp for consistent sorting and rendering
  isOptimistic?: boolean;
  reactions?: string[];
  avatarId?: string;
  replyTo?: {
    userName: string;
    snippet: string;
  };
}

export interface SystemNotification {
  id: string;
  text: string;
  timestamp: number;
}

export interface UserPresence {
  sessionId: string;
  userName: string;
  connectedAt: any;
  lastSeen: any;
  avatarId?: string;
}

export interface TypingUser {
  sessionId: string;
  userName: string;
  lastTyped: number;
}

