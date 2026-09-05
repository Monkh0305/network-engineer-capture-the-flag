import { db } from './db.ts';

export type ActivityEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'MISSION_STARTED'
  | 'MISSION_COMPLETED'
  | 'QUESTION_ANSWERED'
  | 'FLAG_CAPTURED'
  | 'HINT_USED'
  | 'PRETEST_COMPLETED'
  | 'POSTTEST_COMPLETED'
  | 'PACKET_TRACER_DOWNLOADED'
  | 'PACKET_TRACER_UPLOADED'
  | 'PACKET_TRACER_REPLACED'
  | 'PACKET_TRACER_REMOVED'
  | 'ACCOUNT_ENABLED'
  | 'ACCOUNT_DISABLED'
  | 'ROLE_CHANGED'
  | 'XP_ADJUSTED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PROGRESS_RESET'
  | 'ADMIN_USER_UPDATED'
  | 'ADMIN_MISSION_CREATED'
  | 'ADMIN_MISSION_UPDATED'
  | 'ADMIN_MISSION_DELETED'
  | 'ADMIN_FILE_UPLOADED';

export function logActivity(
  userId: number | null,
  eventType: ActivityEventType,
  entityType: string | null = null,
  entityId: number | null = null,
  metadata: Record<string, string | number | boolean | null> | null = null,
): void {
  db.prepare(`
    INSERT INTO activity_logs (user_id, event_type, entity_type, entity_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, eventType, entityType, entityId, metadata ? JSON.stringify(metadata) : null, new Date().toISOString());
}

export function endOpenLearningSession(userId: number, endedAt = new Date().toISOString()): void {
  db.prepare(`
    UPDATE user_learning_sessions
    SET ended_at = ?
    WHERE user_id = ? AND ended_at IS NULL
  `).run(endedAt, userId);
}

export function closeStaleLearningSessions(): void {
  db.prepare(`
    UPDATE user_learning_sessions
    SET ended_at = last_activity_at
    WHERE ended_at IS NULL
      AND datetime(last_activity_at) < datetime('now', '-75 seconds')
  `).run();
}
