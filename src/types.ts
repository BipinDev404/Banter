export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'audio';
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

export interface PrivateChatRequest {
  id: string;
  fromSessionId: string;
  fromUserName: string;
  fromAvatarId?: string;
  toSessionId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined';
  roomId: string;
  createdAt: number;
}

export interface PrivateChatRoom {
  roomId: string;
  partnerSessionId: string;
  partnerName: string;
  partnerAvatarId?: string;
}

export interface TypingUser {
  sessionId: string;
  userName: string;
  lastTyped: number;
}

export interface FriendRequest {
  id: string;
  fromSessionId: string;
  fromUserName: string;
  fromAvatarId?: string;
  toSessionId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface FriendItem {
  friendSessionId: string;
  friendName: string;
  avatarId?: string;
  statusText?: string;
  addedAt: number;
}

export interface GroupMemberInfo {
  sessionId: string;
  userName: string;
  avatarId?: string;
}

export interface GroupItem {
  id: string;
  name: string;
  avatarId?: string;
  createdBy: string;
  creatorName: string;
  members: string[]; // sessionIds
  memberDetails: Record<string, GroupMemberInfo>;
  createdAt: number;
  lastMessage?: string;
  lastMessageAt?: number;
}

export interface BookmarkedMessage {
  id: string;
  messageId: string;
  text: string;
  userName: string;
  timestamp: number;
  attachment?: ChatAttachment;
}
