/** Runtime parsers for values that arrive from Express request bodies/queries. */

export interface Credentials {
  username: string
  password: string
}

export interface RegistrationInput extends Credentials {
  displayName: string
}

export interface SessionInput {
  title: string
  desc?: string
  dtStart: string
  dtEnd: string
  attendType: string
}

export interface SessionTimeRangeInput {
  sessionId: number
  sessionCode: string
  dtStart: string
  dtEnd: string
  status: string
}

export interface DeleteSessionTimeRangeInput {
  sessionTimeRangeId: number
  userSessionId: number
  sessionCode: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const parseCredentials = (value: unknown): Credentials | undefined => {
  if (!isRecord(value) || !nonEmptyString(value.username) || !nonEmptyString(value.password)) return undefined
  return { username: value.username, password: value.password }
}

export const parseRegistration = (value: unknown): RegistrationInput | undefined => {
  if (!isRecord(value)) return undefined
  const credentials = parseCredentials(value)
  if (!credentials || !nonEmptyString(value.displayName)) return undefined
  return { ...credentials, displayName: value.displayName }
}

export const parseSessionInput = (value: unknown): SessionInput | undefined => {
  if (!isRecord(value)) return undefined
  const { title, desc, dtStart, dtEnd, attendType } = value
  if (!nonEmptyString(title) || !nonEmptyString(dtStart) || !nonEmptyString(dtEnd) || !nonEmptyString(attendType)) return undefined
  if (desc !== undefined && typeof desc !== 'string') return undefined
  if (Number.isNaN(Date.parse(dtStart)) || Number.isNaN(Date.parse(dtEnd))) return undefined
  return { title, desc: desc as string | undefined, dtStart, dtEnd, attendType }
}

export const parseSessionInviteCode = (value: unknown): string | undefined => {
  if (!isRecord(value) || !nonEmptyString(value.sessionCode)) return undefined
  return value.sessionCode
}

export const parseJoinSessionInput = (value: unknown): string | undefined => {
  if (!isRecord(value) || !isRecord(value.inviteCode) || !nonEmptyString(value.inviteCode.inviteCode)) return undefined
  return value.inviteCode.inviteCode
}

export const parsePositiveInteger = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  if (typeof value === 'string' && !/^\d+$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

export const parseSessionTimeRange = (value: unknown): SessionTimeRangeInput | undefined => {
  if (!isRecord(value) || !nonEmptyString(value.sessionCode) || !nonEmptyString(value.dtStart) ||
      !nonEmptyString(value.dtEnd) || !nonEmptyString(value.status)) return undefined
  const sessionId = parsePositiveInteger(value.sessionId)
  if (sessionId === undefined || Number.isNaN(Date.parse(value.dtStart)) || Number.isNaN(Date.parse(value.dtEnd))) return undefined
  return { sessionId, sessionCode: value.sessionCode, dtStart: value.dtStart, dtEnd: value.dtEnd, status: value.status }
}

export const parseDeleteSessionTimeRange = (value: unknown): DeleteSessionTimeRangeInput | undefined => {
  if (!isRecord(value) || !nonEmptyString(value.sessionCode)) return undefined
  const sessionTimeRangeId = parsePositiveInteger(value.sessionTimeRangeId)
  const userSessionId = parsePositiveInteger(value.userSessionId)
  if (sessionTimeRangeId === undefined || userSessionId === undefined) return undefined
  return { sessionTimeRangeId, userSessionId, sessionCode: value.sessionCode }
}

export const parseQueryString = (value: unknown): string | undefined =>
  nonEmptyString(value) ? value : undefined

export const parseDisplayName = (value: unknown): string | undefined => {
  if (!isRecord(value) || !nonEmptyString(value.displayName)) return undefined
  const displayName = value.displayName.trim()
  return displayName.length >= 4 && displayName.length <= 25 ? displayName : undefined
}
