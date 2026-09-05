import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { db } from './db.ts';

export const adminReportsRouter = Router();

const canonicalCategory = `CASE
  WHEN mission.category IN ('Fundamental','Network Fundamentals') THEN 'Network Fundamentals'
  WHEN mission.category IN ('IP Addressing','Subnetting') THEN 'IP Addressing'
  WHEN mission.category IN ('Switching','Default Gateway') THEN 'Switching'
  WHEN mission.category='VLAN' THEN 'VLAN'
  WHEN mission.category='Routing' THEN 'Routing'
  WHEN mission.category IN ('Troubleshooting','Security') THEN 'Troubleshooting'
  ELSE mission.category END`;

function positiveId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isoDate(value: unknown): string | null {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? text : null;
}

function reportFilters(query: Record<string, unknown>) {
  const from = isoDate(query.from);
  const to = isoDate(query.to);
  if (from && to && from > to) throw new Error('Start date must not be after end date');
  return { from, to, userId: positiveId(query.userId), missionId: positiveId(query.missionId), category: String(query.category || '').trim() || null };
}

function conditions(filters: ReturnType<typeof reportFilters>, options: { user: string; mission: string; date: string }) {
  const clauses: string[] = [];
  const parameters: Array<string | number> = [];
  if (filters.from) { clauses.push(`date(${options.date},'localtime') >= date(?)`); parameters.push(filters.from); }
  if (filters.to) { clauses.push(`date(${options.date},'localtime') <= date(?)`); parameters.push(filters.to); }
  if (filters.userId) { clauses.push(`${options.user} = ?`); parameters.push(filters.userId); }
  if (filters.missionId) { clauses.push(`${options.mission} = ?`); parameters.push(filters.missionId); }
  if (filters.category) { clauses.push(`${canonicalCategory} = ?`); parameters.push(filters.category); }
  return { sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '', parameters };
}

export function buildAdminReports(query: Record<string, unknown>, database: DatabaseSync = db) {
  const filters = reportFilters(query);
  const activityFilter = conditions(filters, { user: 'activity.user_id', mission: 'activity.entity_id', date: 'activity.created_at' });
  const currentProgressFilter = conditions({ ...filters, from: null, to: null }, { user: 'progress.user_id', mission: 'progress.mission_id', date: 'progress.completed_at' });
  const assessmentClauses: string[] = [];
  const assessmentParameters: Array<string | number> = [];
  if (filters.from) { assessmentClauses.push("date(result.completed_at,'localtime')>=date(?)"); assessmentParameters.push(filters.from); }
  if (filters.to) { assessmentClauses.push("date(result.completed_at,'localtime')<=date(?)"); assessmentParameters.push(filters.to); }
  if (filters.userId) { assessmentClauses.push('result.user_id=?'); assessmentParameters.push(filters.userId); }
  const assessmentFilter = { sql: assessmentClauses.length ? ` AND ${assessmentClauses.join(' AND ')}` : '', parameters: assessmentParameters };
  const sessionFilter = conditions(filters, { user: 'session.user_id', mission: 'session.mission_id', date: 'session.started_at' });
  const hintFilter = conditions(filters, { user: 'used.user_id', mission: 'hint.mission_id', date: 'used.used_at' });

  const scopedByEvents = Boolean(filters.from || filters.to);
  const scopedCte = scopedByEvents ? `SELECT activity.user_id,activity.entity_id AS mission_id,
      MAX(CASE WHEN activity.event_type='MISSION_STARTED' THEN 1 ELSE 0 END) AS started,
      MAX(CASE WHEN activity.event_type='MISSION_COMPLETED' THEN 1 ELSE 0 END) AS completed
    FROM activity_logs activity JOIN users learner ON learner.id=activity.user_id AND learner.role='user'
    JOIN missions mission ON mission.id=activity.entity_id
    WHERE activity.entity_type='mission' AND activity.event_type IN ('MISSION_STARTED','MISSION_COMPLETED')${activityFilter.sql}
    GROUP BY activity.user_id,activity.entity_id` : `SELECT progress.user_id,progress.mission_id,1 AS started,
      CASE WHEN progress.status='completed' THEN 1 ELSE 0 END AS completed
    FROM user_progress progress JOIN users learner ON learner.id=progress.user_id AND learner.role='user'
    JOIN missions mission ON mission.id=progress.mission_id
    WHERE progress.status IN ('in_progress','completed')${currentProgressFilter.sql}`;
  const scopedParameters = scopedByEvents ? activityFilter.parameters : currentProgressFilter.parameters;

  const userProgress = database.prepare(`WITH scoped AS (${scopedCte}) SELECT learner.id AS userId,learner.username,COUNT(scoped.mission_id) AS missionsTouched,
    SUM(scoped.started) AS missionsStarted,SUM(scoped.completed) AS missionsCompleted,
    COALESCE(ROUND(100.0*SUM(scoped.completed)/NULLIF(COUNT(scoped.mission_id),0),1),0) AS completionRate
    FROM users learner JOIN scoped ON scoped.user_id=learner.id GROUP BY learner.id ORDER BY completionRate DESC,learner.username
  `).all(...scopedParameters);

  const missionPerformance = database.prepare(`WITH scoped AS (${scopedCte}) SELECT mission.id AS missionId,mission.title,${canonicalCategory} AS category,COUNT(scoped.user_id) AS learners,
    SUM(scoped.started) AS started,SUM(scoped.completed) AS completed,
    COALESCE(ROUND(100.0*SUM(scoped.completed)/NULLIF(COUNT(scoped.user_id),0),1),0) AS completionRate
    FROM missions mission JOIN scoped ON scoped.mission_id=mission.id GROUP BY mission.id ORDER BY completionRate,mission.order_index
  `).all(...scopedParameters);

  const assessmentPerformance = filters.missionId || filters.category ? [] : database.prepare(`SELECT result.assessment_type AS assessmentType,
    COUNT(*) AS submissions,COUNT(DISTINCT result.user_id) AS participants,ROUND(AVG(result.score),1) AS averageScore,
    MIN(result.score) AS minimumScore,MAX(result.score) AS maximumScore
    FROM assessment_results result JOIN users learner ON learner.id=result.user_id AND learner.role='user'
    WHERE 1=1${assessmentFilter.sql}
    GROUP BY result.assessment_type ORDER BY result.assessment_type
  `).all(...assessmentFilter.parameters);

  const activeLearningTime = database.prepare(`SELECT learner.id AS userId,learner.username,
    SUM(session.active_seconds) AS activeSeconds,COUNT(session.id) AS sessions,
    ROUND(AVG(session.active_seconds),1) AS averageSessionSeconds
    FROM user_learning_sessions session JOIN users learner ON learner.id=session.user_id AND learner.role='user'
    LEFT JOIN missions mission ON mission.id=session.mission_id WHERE 1=1${sessionFilter.sql}
    GROUP BY learner.id ORDER BY activeSeconds DESC
  `).all(...sessionFilter.parameters);

  const hintUsage = database.prepare(`SELECT mission.id AS missionId,mission.title,${canonicalCategory} AS category,
    COUNT(*) AS hintsUsed,COUNT(DISTINCT used.user_id) AS learners
    FROM user_hints used JOIN hints hint ON hint.id=used.hint_id JOIN missions mission ON mission.id=hint.mission_id
    JOIN users learner ON learner.id=used.user_id AND learner.role='user' WHERE 1=1${hintFilter.sql}
    GROUP BY mission.id ORDER BY hintsUsed DESC,mission.order_index
  `).all(...hintFilter.parameters);

  const totalActiveSeconds = (activeLearningTime as any[]).reduce((sum, row) => sum + Number(row.activeSeconds || 0), 0);
  const totalCompleted = (missionPerformance as any[]).reduce((sum, row) => sum + Number(row.completed || 0), 0);
  const totalTouched = (missionPerformance as any[]).reduce((sum, row) => sum + Number(row.learners || 0), 0);
  const totalHints = (hintUsage as any[]).reduce((sum, row) => sum + Number(row.hintsUsed || 0), 0);

  return {
    filters,
    summary: {
      learners: (userProgress as any[]).length,
      missionCompletionRate: totalTouched ? Math.round(totalCompleted * 1000 / totalTouched) / 10 : 0,
      assessmentSubmissions: (assessmentPerformance as any[]).reduce((sum, row) => sum + Number(row.submissions || 0), 0),
      activeLearningSeconds: totalActiveSeconds,
      hintsUsed: totalHints,
    },
    userProgress, missionPerformance, assessmentPerformance, activeLearningTime, hintUsage,
    definitions: {
      dateScope: 'Dates use the local calendar date of each source event or session start.',
      missionCompletionRate: 'Distinct learner-mission pairs completed divided by learner-mission pairs touched by a start or completion event in the selected scope.',
      activeLearningTime: 'Sum of tracked active_seconds for learning sessions whose start date is in the selected scope.',
    },
  };
}

const safeMetadataKeys = new Set(['score','xpEarned','penalty','hintId','filename','previousRole','role','previousXp','xp','correct','action','title']);
function sanitizedMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => safeMetadataKeys.has(key) && ['string','number','boolean'].includes(typeof value)));
  } catch { return null; }
}

export function buildAdminActivity(query: Record<string, unknown>, database: DatabaseSync = db) {
  const page = Math.max(1, Number.parseInt(String(query.page || 1), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(query.pageSize || 20), 10) || 20));
  const search = String(query.search || '').trim();
  const eventType = String(query.eventType || '').trim();
  const userId = positiveId(query.userId);
  const from = isoDate(query.from);
  const to = isoDate(query.to);
  if (from && to && from > to) throw new Error('Start date must not be after end date');
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (search) { clauses.push('(user.username LIKE ? OR activity.event_type LIKE ? OR activity.entity_type LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (eventType) { clauses.push('activity.event_type=?'); params.push(eventType); }
  if (userId) { clauses.push('activity.user_id=?'); params.push(userId); }
  if (from) { clauses.push("date(activity.created_at,'localtime')>=date(?)"); params.push(from); }
  if (to) { clauses.push("date(activity.created_at,'localtime')<=date(?)"); params.push(to); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const total = (database.prepare(`SELECT COUNT(*) AS total FROM activity_logs activity LEFT JOIN users user ON user.id=activity.user_id ${where}`).get(...params) as { total: number }).total;
  const rows = database.prepare(`SELECT activity.id,activity.created_at AS time,user.id AS userId,user.username,
    activity.event_type AS eventType,activity.entity_type AS entityType,activity.entity_id AS entityId,
    CASE WHEN activity.entity_type='mission' THEN mission.title WHEN activity.entity_type='user' THEN target.username
      WHEN activity.entity_type='assessment' THEN assessment.title WHEN activity.entity_type='question' THEN question.question END AS entity,
    activity.metadata FROM activity_logs activity LEFT JOIN users user ON user.id=activity.user_id
    LEFT JOIN missions mission ON activity.entity_type='mission' AND mission.id=activity.entity_id
    LEFT JOIN users target ON activity.entity_type='user' AND target.id=activity.entity_id
    LEFT JOIN assessments assessment ON activity.entity_type='assessment' AND assessment.id=activity.entity_id
    LEFT JOIN questions question ON activity.entity_type='question' AND question.id=activity.entity_id
    ${where} ORDER BY activity.created_at DESC,activity.id DESC LIMIT ? OFFSET ?`).all(...params,pageSize,(page-1)*pageSize) as any[];
  return {
    logs: rows.map(({ metadata, ...row }) => ({ ...row, details: sanitizedMetadata(metadata) })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total/pageSize)) },
  };
}

adminReportsRouter.get('/options', (_req,res) => {
  res.json({
    users: db.prepare("SELECT id,username FROM users WHERE role='user' ORDER BY username").all(),
    missions: db.prepare('SELECT id,title,category FROM missions ORDER BY order_index').all(),
    categories: ['Network Fundamentals','IP Addressing','Switching','VLAN','Routing','Troubleshooting'],
    eventTypes: [...new Set([
      'LOGIN','LOGOUT','MISSION_STARTED','MISSION_COMPLETED','QUESTION_ANSWERED','FLAG_CAPTURED','HINT_USED',
      'PRETEST_COMPLETED','POSTTEST_COMPLETED','PACKET_TRACER_DOWNLOADED','ADMIN_USER_UPDATED',
      'ADMIN_MISSION_CREATED','ADMIN_MISSION_UPDATED','ADMIN_MISSION_DELETED','ADMIN_FILE_UPLOADED',
      ...(db.prepare('SELECT DISTINCT event_type AS eventType FROM activity_logs ORDER BY event_type').all() as Array<{eventType:string}>).map(row=>row.eventType),
    ])].sort(),
  });
});

adminReportsRouter.get('/reports', (req,res) => {
  try { res.json(buildAdminReports(req.query as Record<string,unknown>)); }
  catch (error:any) { res.status(error.message.includes('date') ? 400 : 500).json({error:error.message}); }
});

adminReportsRouter.get('/activity', (req,res) => {
  try { res.json(buildAdminActivity(req.query as Record<string,unknown>)); }
  catch (error:any) { res.status(error.message.includes('date') ? 400 : 500).json({error:error.message}); }
});
