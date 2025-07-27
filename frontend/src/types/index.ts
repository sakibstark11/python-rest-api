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

export type ParticipantResponse = {
  user: UserInfo;
  status: string;
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
  participant_emails?: string[];
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