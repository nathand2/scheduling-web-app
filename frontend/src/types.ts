export type Identifier = string | number;
export type AvailabilityStatus = "going" | "maybe";
export type SessionStatus = "Expired" | "Upcoming" | "Active";

export interface AuthResponse {
  accessToken: string;
  userId: Identifier;
  displayName: string;
}

export interface SessionRecord {
  id?: Identifier;
  code?: string;
  dt_start?: Date | string;
  dt_end?: Date | string;
  dt_created?: Date | string;
  session_title?: string;
  session_desc?: string;
}

export interface SessionListResponse {
  sessions: SessionSummary[];
}

export interface SessionSummary {
  id: Identifier;
  code: string;
  dt_start: Date | string;
  dt_end: Date | string;
  dt_created: Date | string;
  session_title: string;
  session_desc?: string;
}

export interface SessionDetailResponse {
  session: SessionApiRecord;
}

export interface SessionApiRecord extends SessionRecord {
  id: Identifier;
  code: string;
  dt_start: string;
  dt_end: string;
  dt_created: string;
}

export interface AvailabilityRange {
  id?: Identifier;
  user_id?: Identifier;
  user_session_id?: Identifier;
  display_name?: string;
  status?: AvailabilityStatus;
  dt_start: Date | string;
  dt_end: Date | string;
  dt_created?: Date | string;
}

export interface UserSession {
  id?: Identifier;
  user_id?: Identifier;
  display_name?: string;
  role?: string;
}

export interface TimeRangeListResponse {
  results: ApiAvailabilityRange[];
}

export type ApiAvailabilityRange = Omit<AvailabilityRange, "dt_start" | "dt_end" | "dt_created"> & {
  dt_start: string;
  dt_end: string;
  dt_created: string;
};

export interface UserSessionListResponse {
  userSessions: UserSession[];
}

export interface SessionCreatedResponse {
  code: string;
}

export interface SessionInviteResponse {
  inviteCode: string;
}

export interface JoinSessionResponse {
  sessionCode: string;
}

export interface DeleteSessionTimeRangeEvent {
  sessionTimeRangeId: Identifier;
}
