export type User = {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at?: string;
}

export type UserInfo = {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export const ParticipantStatus = {
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  PENDING: 'pending',
} as const;

export const SSEEventType = {
  CONNECTED: 'connected',
  EVENT_UPDATED: 'event_updated',
  EVENT_INVITE_SENT: 'event_invite_sent',
  EVENT_RESPONSE_UPDATED: 'event_response_updated',
  EVENT_DELETED: 'event_deleted',
} as const;

export type ParticipantResponse = {
  user: UserInfo;
  status: (typeof ParticipantStatus)[keyof typeof ParticipantStatus];
  invited_at: string;
  responded_at?: string;
}

export type Event = {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  creator_id: string;
  created_at: string;
  updated_at?: string;
  participants: ParticipantResponse[];
}

export type EventCreate = {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  participant_emails: string[];
}

export type LoginCredentials = {
  email: string;
  password: string;
}

export type SignupData = {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
