export type Conversation = {
  id: string;
  subject: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationParticipant = {
  conversation_id: string;
  profile_id: string;
  joined_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  metadata: {
    read_by?: string[];
    edited_at?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
  attachments?: MessageAttachment[];
};

export type MessageAttachment = {
  id: string;
  message_id: string;
  storage_path: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type MessageReaction = {
  message_id: string;
  profile_id: string;
  reaction: string;
  created_at: string;
};

export type ConversationWithDetails = Conversation & {
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
};

export type SendMessagePayload = {
  conversation_id: string;
  body: string;
  attachments?: File[];
};

export type CreateConversationPayload = {
  subject?: string;
  participant_ids: string[];
  initial_message?: string;
};
