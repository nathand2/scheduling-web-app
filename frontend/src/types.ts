export type Identifier = string | number;

export interface SessionRecord {
  id?: Identifier;
  code?: string;
  dt_start?: Date | string;
  dt_end?: Date | string;
  dt_created?: Date | string;
  session_title?: string;
  session_desc?: string;
  [key: string]: unknown;
}

export interface AvailabilityRange {
  id?: Identifier;
  user_id?: Identifier;
  user_session_id?: Identifier;
  display_name?: string;
  status?: "going" | "maybe" | string;
  dt_start: Date | string;
  dt_end: Date | string;
  dt_created?: Date | string;
}

export interface UserSession {
  id?: Identifier;
  user_id?: Identifier;
  display_name?: string;
  [key: string]: unknown;
}
