import { Router } from 'express';
import { closeStaleLearningSessions, endOpenLearningSession, logActivity } from './activity.ts';
import { getAuthenticatedUser } from './auth.ts';
import { db } from './db.ts';
import { createSessionToken, hashSessionToken } from './security.ts';

export const adminUsersRouter = Router();

const sortColumns: Record<string, string> = {
  username: 'user.username',
  email: 'user.email',
  role: 'user.role',
  level: 'user.level',
  xp: 'user.xp',
  completedMissions: 'completedMissions',
  learningTime: 'learningTime',
  lastActive: 'user.last_activity',
  status: 'user.is_active',
};

function userLevelForXp(xp: number): number {
  if (xp >= 3000) return 5;
  if (xp >= 2000) return 4;
  if (xp >= 1200) return 3;
  if (xp >= 500) return 2;
  return 1;
}

function getTargetUser(id: number) {
  return db.prepare(`
    SELECT id, username, email, role, is_active, level, xp, coins, streak, last_activity, created_at
    FROM users WHERE id = ?
  `).get(id) as unknown as {
    id: number; username: string; email: string; role: 'user' | 'admin'; is_active: number;
    level: number; xp: number; coins: number; streak: number; last_activity: string | null; created_at: string;
  } | undefined;
}

adminUsersRouter.get('/', (req, res) => {
  try {
    closeStaleLearningSessions();
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize || '10'), 10) || 10));
    const search = String(req.query.search || '').trim();
    const role = req.query.role === 'admin' || req.query.role === 'user' ? String(req.query.role) : 'all';
    const status = req.query.status === 'active' || req.query.status === 'inactive' ? String(req.query.status) : 'all';
    const sortBy = sortColumns[String(req.query.sortBy)] ? String(req.query.sortBy) : 'username';
    const sortOrder = String(req.query.sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const conditions: string[] = [];
    const parameters: Array<string | number> = [];
    if (search) {
      conditions.push('(user.username LIKE ? OR user.email LIKE ?)');
      parameters.push(`%${search}%`, `%${search}%`);
    }
    if (role !== 'all') {
      conditions.push('user.role = ?');
      parameters.push(role);
    }
    if (status !== 'all') {
      conditions.push('user.is_active = ?');
      parameters.push(status === 'active' ? 1 : 0);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) AS total FROM users user ${where}`).get(...parameters) as { total: number }).total;
    const users = db.prepare(`
      WITH mission_stats AS (
        SELECT user_id, COUNT(*) AS completed
        FROM user_progress WHERE status = 'completed' GROUP BY user_id
      ), learning_stats AS (
        SELECT user_id, SUM(active_seconds) AS seconds
        FROM user_learning_sessions GROUP BY user_id
      )
      SELECT
        user.id, user.username, user.email, user.role, user.level, user.xp,
        user.is_active AS isActive,
        user.last_activity AS lastActive,
        COALESCE(mission_stats.completed, 0) AS completedMissions,
        COALESCE(learning_stats.seconds, 0) AS learningTime
      FROM users user
      LEFT JOIN mission_stats ON mission_stats.user_id = user.id
      LEFT JOIN learning_stats ON learning_stats.user_id = user.id
      ${where}
      ORDER BY ${sortColumns[sortBy]} ${sortOrder}, user.id ASC
      LIMIT ? OFFSET ?
    `).all(...parameters, pageSize, (page - 1) * pageSize);

    res.json({ users, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.get('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Invalid user id' });
    closeStaleLearningSessions();
    const user = getTargetUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const missionStats = db.prepare(`
      SELECT COUNT(*) AS completedMissions
      FROM user_progress WHERE user_id = ? AND status = 'completed'
    `).get(userId) as { completedMissions: number };
    const learningStats = db.prepare(`
      SELECT
        COALESCE(SUM(active_seconds), 0) AS totalLearningTime,
        COALESCE(SUM(CASE WHEN datetime(started_at) >= datetime('now', '-7 days') THEN active_seconds ELSE 0 END), 0) AS learningTimeThisWeek,
        COALESCE(ROUND(AVG(active_seconds), 1), 0) AS averageSessionTime
      FROM user_learning_sessions WHERE user_id = ?
    `).get(userId) as { totalLearningTime: number; learningTimeThisWeek: number; averageSessionTime: number };

    const assessmentRows = db.prepare(`
      SELECT assessment_type, score FROM (
        SELECT assessment_type, score,
          ROW_NUMBER() OVER (PARTITION BY assessment_type ORDER BY completed_at DESC, id DESC) AS result_rank
        FROM assessment_results WHERE user_id = ?
      ) WHERE result_rank = 1
    `).all(userId) as unknown as Array<{ assessment_type: string; score: number }>;
    const preTest = assessmentRows.find((row) => row.assessment_type === 'pretest')?.score ?? null;
    const postTest = assessmentRows.find((row) => row.assessment_type === 'posttest')?.score ?? null;

    const categoryProgress = db.prepare(`
      WITH categories(name, position) AS (
        VALUES ('Network Fundamentals', 1), ('IP Addressing', 2), ('Switching', 3),
               ('VLAN', 4), ('Routing', 5), ('Troubleshooting', 6)
      ), categorized_missions AS (
        SELECT id,
          CASE
            WHEN category IN ('Fundamental', 'Network Fundamentals') THEN 'Network Fundamentals'
            WHEN category IN ('IP Addressing', 'Subnetting') THEN 'IP Addressing'
            WHEN category IN ('Switching', 'Default Gateway') THEN 'Switching'
            WHEN category = 'VLAN' THEN 'VLAN'
            WHEN category = 'Routing' THEN 'Routing'
            WHEN category IN ('Troubleshooting', 'Security') THEN 'Troubleshooting'
          END AS category_name
        FROM missions
      )
      SELECT categories.name AS category,
        COUNT(categorized_missions.id) AS total,
        COUNT(CASE WHEN progress.status = 'completed' THEN 1 END) AS completed
      FROM categories
      LEFT JOIN categorized_missions ON categorized_missions.category_name = categories.name
      LEFT JOIN user_progress progress ON progress.mission_id = categorized_missions.id AND progress.user_id = ?
      GROUP BY categories.name, categories.position
      ORDER BY categories.position
    `).all(userId);

    const missionHistory = db.prepare(`
      SELECT mission.id AS missionId, mission.title, mission.category, progress.status,
        progress.score, progress.xp_earned AS xpEarned, progress.completed_at AS completedAt
      FROM user_progress progress
      JOIN missions mission ON mission.id = progress.mission_id
      WHERE progress.user_id = ?
      ORDER BY CASE WHEN progress.completed_at IS NULL THEN 1 ELSE 0 END, progress.completed_at DESC, mission.order_index
    `).all(userId);
    const flagHistory = db.prepare(`
      SELECT mission.id AS missionId, mission.title, progress.completed_at AS capturedAt, progress.xp_earned AS xpEarned
      FROM user_progress progress
      JOIN missions mission ON mission.id = progress.mission_id
      WHERE progress.user_id = ? AND progress.status = 'completed'
      ORDER BY progress.completed_at DESC
    `).all(userId);
    const hintUsage = db.prepare(`
      SELECT hint.id AS hintId, hint.hint_order AS hintOrder, hint.xp_penalty AS xpPenalty,
        mission.id AS missionId, mission.title AS mission, used_hint.used_at AS usedAt
      FROM user_hints used_hint
      JOIN hints hint ON hint.id = used_hint.hint_id
      JOIN missions mission ON mission.id = hint.mission_id
      WHERE used_hint.user_id = ? ORDER BY used_hint.used_at DESC
    `).all(userId);
    const recentActivity = (db.prepare(`
      SELECT id, event_type AS eventType, entity_type AS entityType, entity_id AS entityId,
        metadata, created_at AS createdAt
      FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20
    `).all(userId) as unknown as Array<{ id: number; eventType: string; entityType: string | null; entityId: number | null; metadata: string | null; createdAt: string }>).map((activity) => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));

    res.json({
      user: {
        ...user,
        flagsCaptured: missionStats.completedMissions,
        ...missionStats,
        ...learningStats,
      },
      assessment: { preTest, postTest, improvement: preTest !== null && postTest !== null ? postTest - preTest : null },
      categoryProgress,
      missionHistory,
      flagHistory,
      hintUsage,
      recentActivity,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.patch('/:id/status', (req, res) => {
  try {
    const admin = getAuthenticatedUser(req);
    const userId = Number(req.params.id);
    const isActive = req.body.isActive;
    if (!Number.isInteger(userId) || typeof isActive !== 'boolean') return res.status(400).json({ error: 'Valid user id and isActive are required' });
    const user = getTargetUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (userId === admin.id && !isActive) return res.status(400).json({ error: 'You cannot disable your own account' });

    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, userId);
    if (!isActive) {
      endOpenLearningSession(userId);
      db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
    }
    logActivity(userId, isActive ? 'ACCOUNT_ENABLED' : 'ACCOUNT_DISABLED', 'user', userId, { changedBy: admin.id });
    logActivity(admin.id, 'ADMIN_USER_UPDATED', 'user', userId, { action: isActive ? 'enabled' : 'disabled' });
    res.json({ user: getTargetUser(userId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.patch('/:id/role', (req, res) => {
  try {
    const admin = getAuthenticatedUser(req);
    const userId = Number(req.params.id);
    const role = req.body.role;
    if (!Number.isInteger(userId) || (role !== 'user' && role !== 'admin')) return res.status(400).json({ error: 'Valid user id and role are required' });
    const user = getTargetUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (userId === admin.id && role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own admin role' });

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    logActivity(userId, 'ROLE_CHANGED', 'user', userId, { changedBy: admin.id, previousRole: user.role, role });
    logActivity(admin.id, 'ADMIN_USER_UPDATED', 'user', userId, { action: 'role_changed', previousRole: user.role, role });
    res.json({ user: getTargetUser(userId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.patch('/:id/xp', (req, res) => {
  try {
    const admin = getAuthenticatedUser(req);
    const userId = Number(req.params.id);
    const xp = Number(req.body.xp);
    if (!Number.isInteger(userId) || !Number.isInteger(xp) || xp < 0 || xp > 10_000_000) return res.status(400).json({ error: 'XP must be an integer between 0 and 10,000,000' });
    const user = getTargetUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(xp, userLevelForXp(xp), userId);
    logActivity(userId, 'XP_ADJUSTED', 'user', userId, { changedBy: admin.id, previousXp: user.xp, xp });
    logActivity(admin.id, 'ADMIN_USER_UPDATED', 'user', userId, { action: 'xp_adjusted', previousXp: user.xp, xp });
    res.json({ user: getTargetUser(userId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post('/:id/password-reset', (req, res) => {
  try {
    const admin = getAuthenticatedUser(req);
    const userId = Number(req.params.id);
    const user = getTargetUser(userId);
    if (!Number.isInteger(userId) || !user) return res.status(404).json({ error: 'User not found' });
    const token = createSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL').run(now.toISOString(), userId);
    db.prepare(`
      INSERT INTO password_reset_tokens (user_id, token_hash, created_at, expires_at, used_at)
      VALUES (?, ?, ?, ?, NULL)
    `).run(userId, hashSessionToken(token), now.toISOString(), expiresAt.toISOString());
    logActivity(userId, 'PASSWORD_RESET_REQUESTED', 'user', userId, { requestedBy: admin.id });
    logActivity(admin.id, 'ADMIN_USER_UPDATED', 'user', userId, { action: 'password_reset_requested' });
    res.json({ resetUrl: `/reset-password?token=${encodeURIComponent(token)}`, expiresAt: expiresAt.toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post('/:id/progress/reset', (req, res) => {
  const admin = getAuthenticatedUser(req);
  const userId = Number(req.params.id);
  const user = getTargetUser(userId);
  if (!Number.isInteger(userId) || !user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Admin learning progress cannot be reset' });

  try {
    db.exec('BEGIN');
    endOpenLearningSession(userId);
    db.prepare('DELETE FROM user_answers WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_hints WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM assessment_results WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_learning_sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_progress WHERE user_id = ?').run(userId);
    db.prepare(`
      INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned, completed_at)
      SELECT ?, id, CASE WHEN order_index = 1 THEN 'unlocked' ELSE 'locked' END, 0, 0, NULL
      FROM missions
    `).run(userId);
    db.prepare('UPDATE users SET level = 1, xp = 0, coins = 100, streak = 1 WHERE id = ?').run(userId);
    db.exec('COMMIT');
    logActivity(userId, 'PROGRESS_RESET', 'user', userId, { resetBy: admin.id });
    logActivity(admin.id, 'ADMIN_USER_UPDATED', 'user', userId, { action: 'progress_reset' });
    res.json({ success: true, user: getTargetUser(userId) });
  } catch (error: any) {
    try { db.exec('ROLLBACK'); } catch { /* transaction was not open */ }
    res.status(500).json({ error: error.message });
  }
});
