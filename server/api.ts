import { Router, type Request } from 'express';
import { db, initDatabase } from './db.ts';
import {
  createSession,
  destroySession,
  getAuthenticatedUser,
  getSessionUserFromRequest,
  requireAdmin,
  requireAuth,
  setSessionCookie,
} from './auth.ts';
import { hashPassword, hashSessionToken, verifyPassword } from './security.ts';
import { closeStaleLearningSessions, endOpenLearningSession, logActivity } from './activity.ts';
import { adminUsersRouter } from './adminUsers.ts';
import { adminMissionsRouter } from './adminMissions.ts';
import { adminPacketTracerRouter, getStoredLabForMission, sendStoredLab } from './adminPacketTracer.ts';
import { adminLearningPathsRouter } from './adminLearningPaths.ts';
import { adminAchievementsRouter } from './adminAchievements.ts';
import { adminAssessmentsRouter } from './adminAssessments.ts';
import { adminAnalyticsRouter } from './adminAnalytics.ts';
import { adminReportsRouter } from './adminReports.ts';

// Ensure DB is initialized
initDatabase();

export const apiRouter = Router();

function getCurrentUserId(req: Request): number {
  return getAuthenticatedUser(req).id;
}

// Level threshold calculations
function calculateLevel(xp: number): number {
  if (xp >= 3000) return 5;
  if (xp >= 2000) return 4;
  if (xp >= 1200) return 3;
  if (xp >= 500) return 2;
  return 1;
}

// ---------------- AUTHENTICATION ----------------
apiRouter.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedUsername.length < 3 || password.length < 8 || !normalizedEmail.includes('@')) {
      return res.status(400).json({ error: 'Use a valid email, a username of at least 3 characters, and a password of at least 8 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(normalizedUsername, normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, level, xp, coins, streak, created_at)
      VALUES (?, ?, ?, 1, 0, 100, 1, ?)
    `);
    const result = insertUser.run(normalizedUsername, normalizedEmail, hashPassword(password), new Date().toISOString());
    const userId = Number(result.lastInsertRowid);

    // Initialize missions progress: Mission 1 unlocked, others locked
    const missions = db.prepare("SELECT id, order_index FROM missions WHERE status = 'published' ORDER BY order_index ASC").all() as { id: number; order_index: number }[];
    const insertProg = db.prepare(`
      INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned, completed_at)
      VALUES (?, ?, ?, 0, 0, NULL)
    `);

    missions.forEach((m) => {
      insertProg.run(userId, m.id, m.order_index === 1 ? 'unlocked' : 'locked');
    });

    const lastActivity = new Date().toISOString();
    db.prepare('UPDATE users SET last_activity = ? WHERE id = ?').run(lastActivity, userId);
    const user = db.prepare('SELECT id, username, email, role, is_active, last_activity, level, xp, coins, streak, created_at FROM users WHERE id = ?').get(userId);
    const sessionToken = createSession(userId);
    setSessionCookie(res, sessionToken);
    logActivity(userId, 'LOGIN');
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT id, username, email, password_hash, role, is_active, last_activity, level, xp, coins, streak, created_at FROM users WHERE email = ? OR username = ?')
      .get(email.trim().toLowerCase(), email.trim()) as any;

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'This account is disabled' });
    }

    delete user.password_hash;
    const lastActivity = new Date().toISOString();
    db.prepare('UPDATE users SET last_activity = ? WHERE id = ?').run(lastActivity, user.id);
    user.last_activity = lastActivity;
    db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(lastActivity);
    const sessionToken = createSession(user.id);
    setSessionCookie(res, sessionToken);
    logActivity(user.id, 'LOGIN');
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/auth/logout', (req, res) => {
  const user = getSessionUserFromRequest(req);
  if (user) {
    endOpenLearningSession(user.id);
    logActivity(user.id, 'LOGOUT');
  }
  destroySession(req, res);
  res.json({ success: true });
});

apiRouter.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'A valid reset token and password of at least 8 characters are required' });
  }

  const reset = db.prepare(`
    SELECT id, user_id FROM password_reset_tokens
    WHERE token_hash = ? AND used_at IS NULL AND datetime(expires_at) > datetime('now')
  `).get(hashSessionToken(token)) as { id: number; user_id: number } | undefined;
  if (!reset) return res.status(400).json({ error: 'Reset link is invalid or expired' });

  try {
    const now = new Date().toISOString();
    db.exec('BEGIN');
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), reset.user_id);
    db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(now, reset.id);
    db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(reset.user_id);
    endOpenLearningSession(reset.user_id, now);
    db.exec('COMMIT');
    logActivity(reset.user_id, 'PASSWORD_RESET_COMPLETED', 'user', reset.user_id);
    return res.json({ success: true });
  } catch (error: any) {
    try { db.exec('ROLLBACK'); } catch { /* transaction was not open */ }
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.use('/api', requireAuth);

apiRouter.get('/api/auth/me', (req, res) => {
  try {
    res.json({ user: getAuthenticatedUser(req) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/admin/access-check', requireAdmin, (req, res) => {
  res.json({ authorized: true, user: getAuthenticatedUser(req) });
});

apiRouter.use('/api/admin/users', requireAdmin, adminUsersRouter);
apiRouter.use('/api/admin/missions', requireAdmin, adminMissionsRouter);
apiRouter.use('/api/admin/packet-tracer', requireAdmin, adminPacketTracerRouter);
apiRouter.use('/api/admin/learning-paths', requireAdmin, adminLearningPathsRouter);
apiRouter.use('/api/admin/achievements', requireAdmin, adminAchievementsRouter);
apiRouter.use('/api/admin/assessments', requireAdmin, adminAssessmentsRouter);
apiRouter.use('/api/admin/analytics', requireAdmin, adminAnalyticsRouter);
apiRouter.use('/api/admin', requireAdmin, adminReportsRouter);

const learningSessionTypes = new Set(['mission', 'learning_path', 'assessment', 'packet_tracer', 'other_learning']);
const assessmentAnswerOptions = new Set(['A', 'B', 'C', 'D']);
const maximumHeartbeatGapSeconds = 75;

apiRouter.post('/api/learning/heartbeat', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { active, sessionType, missionId } = req.body;

    if (active !== true) {
      endOpenLearningSession(userId);
      return res.json({ active: false });
    }
    if (typeof sessionType !== 'string' || !learningSessionTypes.has(sessionType)) {
      return res.status(400).json({ error: 'Invalid learning session type' });
    }

    const normalizedMissionId = missionId === null || missionId === undefined ? null : Number(missionId);
    if (normalizedMissionId !== null) {
      if (!Number.isInteger(normalizedMissionId) || normalizedMissionId <= 0) {
        return res.status(400).json({ error: 'Invalid mission id' });
      }
      const missionExists = db.prepare('SELECT id FROM missions WHERE id = ?').get(normalizedMissionId);
      if (!missionExists) return res.status(404).json({ error: 'Mission not found' });
    }
    if (sessionType === 'mission' && normalizedMissionId === null) {
      return res.status(400).json({ error: 'Mission learning sessions require a mission id' });
    }

    closeStaleLearningSessions();
    const now = new Date();
    const nowIso = now.toISOString();
    let session = db.prepare(`
      SELECT id, session_type, mission_id, last_activity_at, active_seconds
      FROM user_learning_sessions
      WHERE user_id = ? AND ended_at IS NULL
    `).get(userId) as unknown as {
      id: number;
      session_type: string;
      mission_id: number | null;
      last_activity_at: string;
      active_seconds: number;
    } | undefined;

    const contextChanged = session
      && (session.session_type !== sessionType || session.mission_id !== normalizedMissionId);
    if (session && contextChanged) {
      endOpenLearningSession(userId, session.last_activity_at);
      session = undefined;
    }

    if (session) {
      const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - Date.parse(session.last_activity_at)) / 1000));
      if (elapsedSeconds > maximumHeartbeatGapSeconds) {
        endOpenLearningSession(userId, session.last_activity_at);
        session = undefined;
      } else {
        db.prepare(`
          UPDATE user_learning_sessions
          SET last_activity_at = ?, active_seconds = active_seconds + ?
          WHERE id = ?
        `).run(nowIso, elapsedSeconds, session.id);
        return res.json({ active: true, sessionId: session.id, activeSeconds: session.active_seconds + elapsedSeconds });
      }
    }

    const inserted = db.prepare(`
      INSERT INTO user_learning_sessions (
        user_id, mission_id, session_type, started_at, last_activity_at, ended_at, active_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, NULL, 0, ?)
    `).run(userId, normalizedMissionId, sessionType, nowIso, nowIso, nowIso);

    return res.json({ active: true, sessionId: Number(inserted.lastInsertRowid), activeSeconds: 0 });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  try {
    closeStaleLearningSessions();
    const userSummary = db.prepare(`
      SELECT
        COUNT(*) AS totalUsers,
        COALESCE(SUM(CASE
          WHEN is_active = 1
            AND last_activity IS NOT NULL
            AND datetime(last_activity) >= datetime('now', '-5 minutes')
          THEN 1 ELSE 0 END), 0) AS onlineUsers,
        COALESCE(SUM(CASE
          WHEN is_active = 1
            AND last_activity IS NOT NULL
            AND date(last_activity, 'localtime') = date('now', 'localtime')
          THEN 1 ELSE 0 END), 0) AS activeUsersToday
      FROM users
    `).get() as unknown as { totalUsers: number; onlineUsers: number; activeUsersToday: number };

    const completionSummary = db.prepare(`
      SELECT COUNT(*) AS total
      FROM user_progress progress
      JOIN users learner ON learner.id = progress.user_id
      WHERE learner.role = 'user' AND progress.status = 'completed'
    `).get() as unknown as { total: number };

    const learningTimeSummary = db.prepare(`
      SELECT COALESCE(SUM(session.active_seconds), 0) AS total
      FROM user_learning_sessions session
      JOIN users learner ON learner.id = session.user_id
      WHERE learner.role = 'user'
    `).get() as unknown as { total: number };

    const activityTrend = db.prepare(`
      WITH RECURSIVE days(day) AS (
        SELECT date('now', 'localtime', '-6 days')
        UNION ALL
        SELECT date(day, '+1 day') FROM days WHERE day < date('now', 'localtime')
      )
      SELECT
        days.day AS date,
        COUNT(DISTINCT CASE WHEN learner.role = 'user' THEN activity.user_id END) AS activeUsers,
        COUNT(CASE WHEN learner.role = 'user' THEN 1 END) AS events
      FROM days
      LEFT JOIN activity_logs activity ON date(activity.created_at, 'localtime') = days.day
      LEFT JOIN users learner ON learner.id = activity.user_id
      GROUP BY days.day
      ORDER BY days.day
    `).all() as unknown as Array<{ date: string; activeUsers: number; events: number }>;

    const learningPerformance = db.prepare(`
      WITH ranked_results AS (
        SELECT
          result.user_id,
          result.assessment_type,
          result.score,
          ROW_NUMBER() OVER (
            PARTITION BY result.user_id, result.assessment_type
            ORDER BY result.completed_at DESC, result.id DESC
          ) AS result_rank
        FROM assessment_results result
        JOIN users learner ON learner.id = result.user_id
        WHERE learner.role = 'user'
      ), learner_scores AS (
        SELECT
          user_id,
          MAX(CASE WHEN assessment_type = 'pretest' AND result_rank = 1 THEN score END) AS pre_test,
          MAX(CASE WHEN assessment_type = 'posttest' AND result_rank = 1 THEN score END) AS post_test
        FROM ranked_results
        WHERE result_rank = 1
        GROUP BY user_id
      )
      SELECT
        ROUND(AVG(pre_test), 1) AS averagePreTestScore,
        ROUND(AVG(post_test), 1) AS averagePostTestScore,
        ROUND(AVG(CASE
          WHEN pre_test IS NOT NULL AND post_test IS NOT NULL THEN post_test - pre_test
        END), 1) AS averageImprovement
      FROM learner_scores
    `).get() as unknown as {
      averagePreTestScore: number | null;
      averagePostTestScore: number | null;
      averageImprovement: number | null;
    };

    const missionPerformance = db.prepare(`
      WITH learners AS (
        SELECT COUNT(*) AS total FROM users WHERE role = 'user' AND is_active = 1
      ), learner_mission_time AS (
        SELECT session.user_id, session.mission_id, SUM(session.active_seconds) AS active_seconds
        FROM user_learning_sessions session
        JOIN users learner ON learner.id = session.user_id AND learner.role = 'user'
        WHERE session.mission_id IS NOT NULL
        GROUP BY session.user_id, session.mission_id
      ), mission_average_time AS (
        SELECT mission_id, ROUND(AVG(active_seconds) / 60.0, 1) AS average_minutes
        FROM learner_mission_time
        GROUP BY mission_id
      )
      SELECT
        mission.id AS missionId,
        mission.title AS mission,
        COALESCE(ROUND(100.0 * (
          SELECT COUNT(*)
          FROM user_progress progress
          JOIN users learner ON learner.id = progress.user_id
          WHERE progress.mission_id = mission.id
            AND progress.status = 'completed'
            AND learner.role = 'user'
        ) / NULLIF(learners.total, 0), 1), 0) AS completionRate,
        mission_average_time.average_minutes AS averageTimeMinutes,
        COALESCE(ROUND(100.0 * (
          SELECT COUNT(DISTINCT used_hint.user_id)
          FROM user_hints used_hint
          JOIN hints hint ON hint.id = used_hint.hint_id
          JOIN users learner ON learner.id = used_hint.user_id
          WHERE hint.mission_id = mission.id AND learner.role = 'user'
        ) / NULLIF((
          SELECT COUNT(DISTINCT progress.user_id)
          FROM user_progress progress
          JOIN users learner ON learner.id = progress.user_id
          WHERE progress.mission_id = mission.id
            AND learner.role = 'user'
            AND progress.status IN ('in_progress', 'completed')
        ), 0), 1), 0) AS hintUsage
      FROM missions mission
      CROSS JOIN learners
      LEFT JOIN mission_average_time ON mission_average_time.mission_id = mission.id
      ORDER BY mission.order_index
      LIMIT 6
    `).all() as unknown as Array<{
      missionId: number;
      mission: string;
      completionRate: number;
      averageTimeMinutes: number | null;
      hintUsage: number;
    }>;

    const recentActivity = db.prepare(`
      SELECT
        'activity-' || activity.id AS id,
        activity.event_type AS eventType,
        COALESCE(user.username, 'Deleted user') AS username,
        mission.title AS mission,
        CASE
          WHEN activity.event_type = 'PRETEST_COMPLETED' THEN 'pretest'
          WHEN activity.event_type = 'POSTTEST_COMPLETED' THEN 'posttest'
          ELSE NULL
        END AS assessmentType,
        activity.created_at AS createdAt
      FROM activity_logs activity
      LEFT JOIN users user ON user.id = activity.user_id
      LEFT JOIN missions mission
        ON activity.entity_type = 'mission' AND mission.id = activity.entity_id
      ORDER BY datetime(activity.created_at) DESC, activity.id DESC
      LIMIT 8
    `).all() as unknown as Array<{
      id: string;
      eventType: 'LOGIN' | 'LOGOUT' | 'MISSION_STARTED' | 'MISSION_COMPLETED' | 'QUESTION_ANSWERED' | 'FLAG_CAPTURED' | 'HINT_USED' | 'PRETEST_COMPLETED' | 'POSTTEST_COMPLETED' | 'PACKET_TRACER_DOWNLOADED' | 'ACCOUNT_ENABLED' | 'ACCOUNT_DISABLED' | 'ROLE_CHANGED' | 'XP_ADJUSTED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_COMPLETED' | 'PROGRESS_RESET';
      username: string;
      mission: string | null;
      assessmentType: string | null;
      createdAt: string;
    }>;

    res.json({
      generatedAt: new Date().toISOString(),
      kpis: {
        ...userSummary,
        totalActiveLearningSeconds: learningTimeSummary.total,
        totalMissionCompletions: completionSummary.total,
        totalFlagsCaptured: completionSummary.total,
      },
      dataAvailability: {
        activeLearningTime: true,
        missionAverageTime: true,
      },
      activityTrend,
      learningPerformance,
      missionPerformance,
      recentActivity,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- MISSIONS ----------------
apiRouter.get('/api/missions', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const missions = db.prepare(`
      SELECT 
        m.*,
        COALESCE(p.status, CASE WHEN m.order_index = 1 THEN 'unlocked' ELSE 'locked' END) as status,
        COALESCE(p.score, 0) as score,
        COALESCE(p.xp_earned, 0) as xp_earned,
        p.completed_at
      FROM missions m
      LEFT JOIN user_progress p ON m.id = p.mission_id AND p.user_id = ?
      WHERE m.status = 'published'
      ORDER BY m.order_index ASC
    `).all(userId) as any[];

    // Parse topology and checklists JSON for client
    const formatted = missions.map((m) => {
      let topology = null;
      let checklists = [];
      try { topology = JSON.parse(m.topology_json); } catch (e) {}
      try { checklists = JSON.parse(m.checklists_json); } catch (e) {}

      // Calculate completion %
      let completionPercentage = 0;
      if (m.status === 'completed') completionPercentage = 100;
      else if (m.status === 'in_progress') completionPercentage = m.score || 50;
      else completionPercentage = 0;

      const { target_flag: targetFlag, ...publicMission } = m;
      return {
        ...publicMission,
        ...(m.status === 'completed' ? { target_flag: targetFlag } : {}),
        topology,
        checklists,
        completionPercentage
      };
    });

    res.json({ missions: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/missions/:id', (req, res) => {
  try {
    const missionId = Number(req.params.id);
    const userId = getCurrentUserId(req);

    const mission = db.prepare(`
      SELECT 
        m.*,
        COALESCE(p.status, CASE WHEN m.order_index = 1 THEN 'unlocked' ELSE 'locked' END) as status,
        COALESCE(p.score, 0) as score,
        COALESCE(p.xp_earned, 0) as xp_earned,
        p.completed_at
      FROM missions m
      LEFT JOIN user_progress p ON m.id = p.mission_id AND p.user_id = ?
      WHERE m.id = ? AND m.status = 'published'
    `).get(userId, missionId) as any;

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    if (mission.status === 'unlocked') {
      db.prepare(`
        INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned)
        VALUES (?, ?, 'in_progress', 0, 0)
        ON CONFLICT(user_id, mission_id) DO UPDATE SET status = 'in_progress'
      `).run(userId, missionId);
      mission.status = 'in_progress';
      logActivity(userId, 'MISSION_STARTED', 'mission', missionId);
    }

    const tasks = db.prepare('SELECT * FROM mission_tasks WHERE mission_id = ? AND is_enabled = 1 ORDER BY order_index ASC').all(missionId);
    
    // Get hints and check if used by user
    const hints = db.prepare(`
      SELECT 
        h.id, h.hint_order, h.xp_penalty,
        CASE WHEN uh.id IS NOT NULL THEN h.hint_text ELSE NULL END as hint_text,
        CASE WHEN uh.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
      FROM hints h
      LEFT JOIN user_hints uh ON h.id = uh.hint_id AND uh.user_id = ?
      WHERE h.mission_id = ?
      ORDER BY h.hint_order ASC
    `).all(userId, missionId);

    // Questions count and user answers count
    const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM questions WHERE mission_id = ?').get(missionId) as any;
    const answeredCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE q.mission_id = ? AND ua.user_id = ? AND ua.is_correct = 1
    `).get(missionId, userId) as any;

    let topology = null;
    let checklists = [];
    try { topology = JSON.parse(mission.topology_json); } catch (e) {}
    try { checklists = JSON.parse(mission.checklists_json); } catch (e) {}

    const { target_flag: targetFlag, ...publicMission } = mission;
    res.json({
      mission: {
        ...publicMission,
        ...(mission.status === 'completed' ? { target_flag: targetFlag } : {}),
        topology,
        checklists,
        totalQuestions: totalQuestions.count,
        answeredCount: answeredCount.count
      },
      tasks,
      hints
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/missions/:id/questions', (req, res) => {
  try {
    const missionId = Number(req.params.id);
    const userId = getCurrentUserId(req);

    const questions = db.prepare(`
      SELECT 
        q.id, q.mission_id, q.question, q.option_a, q.option_b, q.option_c, q.option_d,
        ua.selected_answer, ua.is_correct,
        CASE WHEN ua.is_correct = 1 THEN q.root_cause ELSE NULL END as root_cause,
        CASE WHEN ua.is_correct = 1 THEN q.explanation ELSE NULL END as explanation
      FROM questions q
      JOIN missions m ON m.id = q.mission_id AND m.status = 'published'
      LEFT JOIN user_answers ua ON q.id = ua.question_id AND ua.user_id = ?
      WHERE q.mission_id = ?
      ORDER BY q.id ASC
    `).all(userId, missionId);

    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/missions/:id/answer', (req, res) => {
  try {
    const missionId = Number(req.params.id);
    const userId = getCurrentUserId(req);
    const { questionId, selectedAnswer } = req.body;

    if (!questionId || !selectedAnswer) {
      return res.status(400).json({ error: 'questionId and selectedAnswer are required' });
    }

    const question = db.prepare(`SELECT q.* FROM questions q JOIN missions m ON m.id = q.mission_id
      WHERE q.id = ? AND q.mission_id = ? AND m.status = 'published'`).get(questionId, missionId) as any;
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = question.correct_answer.toUpperCase() === selectedAnswer.toUpperCase();

    // Store or update answer
    const existing = db.prepare('SELECT id FROM user_answers WHERE user_id = ? AND question_id = ?').get(userId, questionId);
    if (existing) {
      db.prepare('UPDATE user_answers SET selected_answer = ?, is_correct = ? WHERE user_id = ? AND question_id = ?')
        .run(selectedAnswer, isCorrect ? 1 : 0, userId, questionId);
    } else {
      db.prepare('INSERT INTO user_answers (user_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)')
        .run(userId, questionId, selectedAnswer, isCorrect ? 1 : 0);
    }
    logActivity(userId, 'QUESTION_ANSWERED', 'question', Number(questionId), {
      missionId,
      correct: isCorrect,
    });

    // Update mission status to in_progress if currently unlocked
    const prog = db.prepare('SELECT status FROM user_progress WHERE user_id = ? AND mission_id = ?').get(userId, missionId) as any;
    if (!prog || prog.status === 'unlocked') {
      db.prepare(`
        INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned)
        VALUES (?, ?, 'in_progress', 65, 0)
        ON CONFLICT(user_id, mission_id) DO UPDATE SET status = 'in_progress', score = 65
      `).run(userId, missionId);
    }

    res.json({
      isCorrect,
      rootCause: isCorrect ? question.root_cause : null,
      explanation: isCorrect ? question.explanation : 'Incorrect answer. Analyze the topology and verify IP configurations, or consult the investigation checklist.',
      selectedAnswer
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/missions/:id/hint', (req, res) => {
  try {
    const missionId = Number(req.params.id);
    const userId = getCurrentUserId(req);
    const { hintId } = req.body;

    if (!hintId) {
      return res.status(400).json({ error: 'hintId is required' });
    }

    const hint = db.prepare(`SELECT h.* FROM hints h JOIN missions m ON m.id = h.mission_id
      WHERE h.id = ? AND h.mission_id = ? AND m.status = 'published'`).get(hintId, missionId) as any;
    if (!hint) {
      return res.status(404).json({ error: 'Hint not found' });
    }

    // Check if already used
    const used = db.prepare('SELECT id FROM user_hints WHERE user_id = ? AND hint_id = ?').get(userId, hintId);
    if (!used) {
      db.prepare('INSERT INTO user_hints (user_id, hint_id, used_at) VALUES (?, ?, ?)')
        .run(userId, hintId, new Date().toISOString());
      logActivity(userId, 'HINT_USED', 'mission', missionId, { hintId: Number(hintId) });
    }

    res.json({
      hintId: hint.id,
      hintOrder: hint.hint_order,
      hintText: hint.hint_text,
      xpPenalty: hint.xp_penalty
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/missions/:id/complete', (req, res) => {
  try {
    const missionId = Number(req.params.id);
    const userId = getCurrentUserId(req);
    const { submittedFlag } = req.body;

    const mission = db.prepare("SELECT * FROM missions WHERE id = ? AND status = 'published'").get(missionId) as any;
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const questionProgress = db.prepare(`
      SELECT
        COUNT(q.id) AS total_questions,
        COUNT(CASE WHEN ua.is_correct = 1 THEN 1 END) AS correct_answers
      FROM questions q
      LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = ?
      WHERE q.mission_id = ?
    `).get(userId, missionId) as { total_questions: number; correct_answers: number };

    if (questionProgress.total_questions > 0 && questionProgress.correct_answers < questionProgress.total_questions) {
      return res.status(403).json({ error: 'Complete all mission questions correctly before submitting the flag' });
    }

    // Verify flag
    const normalizedSubmitted = typeof submittedFlag === 'string' ? submittedFlag.trim() : '';
    const normalizedTarget = mission.target_flag.trim();
    if (normalizedSubmitted.toLowerCase() !== normalizedTarget.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: `Incorrect flag format or value. Hint: The flag follows the pattern FLAG{...}`
      });
    }

    // Calculate XP penalty from used hints
    const usedHints = db.prepare(`
      SELECT h.xp_penalty 
      FROM user_hints uh 
      JOIN hints h ON uh.hint_id = h.id 
      WHERE uh.user_id = ? AND h.mission_id = ?
    `).all(userId, missionId) as any[];

    const totalPenalty = usedHints.reduce((acc, h) => acc + h.xp_penalty, 0);
    const finalXp = Math.max(30, mission.xp_reward - totalPenalty);
    const coinsReward = mission.coin_reward ?? 500;

    // Check if already completed
    const existingProg = db.prepare('SELECT status, xp_earned FROM user_progress WHERE user_id = ? AND mission_id = ?').get(userId, missionId) as any;
    const isFirstTimeCompletion = !existingProg || existingProg.status !== 'completed';

    // Mark mission completed
    db.prepare(`
      INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned, completed_at)
      VALUES (?, ?, 'completed', 100, ?, ?)
      ON CONFLICT(user_id, mission_id) DO UPDATE SET 
        status = 'completed',
        score = CASE WHEN user_progress.status = 'completed' THEN user_progress.score ELSE 100 END,
        xp_earned = CASE WHEN user_progress.status = 'completed' THEN user_progress.xp_earned ELSE excluded.xp_earned END,
        completed_at = CASE WHEN user_progress.status = 'completed' THEN user_progress.completed_at ELSE excluded.completed_at END
    `).run(userId, missionId, finalXp, new Date().toISOString());

    // Unlock next mission in sequence
    const nextMission = db.prepare("SELECT id FROM missions WHERE status = 'published' AND order_index > ? ORDER BY order_index LIMIT 1").get(mission.order_index) as any;
    if (nextMission) {
      db.prepare(`
        INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned)
        VALUES (?, ?, 'unlocked', 0, 0)
        ON CONFLICT(user_id, mission_id) DO UPDATE SET 
          status = CASE WHEN user_progress.status = 'locked' THEN 'unlocked' ELSE user_progress.status END
      `).run(userId, nextMission.id);
    }

    // Update user stats if first time
    if (isFirstTimeCompletion) {
      const user = db.prepare('SELECT xp, coins FROM users WHERE id = ?').get(userId) as any;
      const newXp = (user.xp || 0) + finalXp;
      const newCoins = (user.coins || 0) + coinsReward;
      const newLevel = calculateLevel(newXp);

      db.prepare('UPDATE users SET xp = ?, coins = ?, level = ? WHERE id = ?')
        .run(newXp, newCoins, newLevel, userId);
      logActivity(userId, 'FLAG_CAPTURED', 'mission', missionId);
      logActivity(userId, 'MISSION_COMPLETED', 'mission', missionId, {
        xpEarned: finalXp,
        hintPenalty: totalPenalty,
      });
    }

    // Check achievements
    checkAndAwardAchievements(userId);

    const updatedUser = db.prepare('SELECT id, username, level, xp, coins, streak FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: 'MISSION COMPLETE! Flag verified.',
      flag: mission.target_flag,
      xpEarned: isFirstTimeCompletion ? finalXp : 0,
      coinsEarned: isFirstTimeCompletion ? coinsReward : 0,
      penalty: totalPenalty,
      user: updatedUser,
      nextMissionId: nextMission ? nextMission.id : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function checkAndAwardAchievements(userId: number) {
  try {
    const achievements = db.prepare('SELECT id,condition_type,condition_value FROM achievements WHERE is_active=1').all() as unknown as Array<{ id: number; condition_type: string; condition_value: number }>;
    const count = (sql: string, ...params: Array<string | number>) => (db.prepare(sql).get(...params) as { count: number }).count;
    for (const item of achievements) {
      let current = 0;
      if (item.condition_type === 'mission_count') current = count("SELECT COUNT(*) AS count FROM user_progress WHERE user_id=? AND status='completed'", userId);
      else if (item.condition_type === 'category_routing') current = count("SELECT COUNT(*) AS count FROM user_progress p JOIN missions m ON m.id=p.mission_id WHERE p.user_id=? AND p.status='completed' AND m.category='Routing'", userId);
      else if (item.condition_type === 'category_vlan') current = count("SELECT COUNT(*) AS count FROM user_progress p JOIN missions m ON m.id=p.mission_id WHERE p.user_id=? AND p.status='completed' AND m.category='VLAN'", userId);
      else if (item.condition_type === 'category_ip_addressing') current = count("SELECT COUNT(*) AS count FROM user_progress p JOIN missions m ON m.id=p.mission_id WHERE p.user_id=? AND p.status='completed' AND m.category='IP Addressing'", userId);
      else if (item.condition_type === 'no_hint_completion') current = count(`SELECT COUNT(*) AS count FROM user_progress p WHERE p.user_id=? AND p.status='completed' AND NOT EXISTS (
        SELECT 1 FROM user_hints uh JOIN hints h ON h.id=uh.hint_id WHERE uh.user_id=p.user_id AND h.mission_id=p.mission_id)`, userId);
      else if (item.condition_type === 'perfect_score_count') current = count("SELECT COUNT(*) AS count FROM user_progress WHERE user_id=? AND status='completed' AND score>=100", userId);
      else if (item.condition_type === 'packet_tracer_download_count') current = count("SELECT COUNT(*) AS count FROM activity_logs WHERE user_id=? AND event_type='PACKET_TRACER_DOWNLOADED'", userId);
      else if (item.condition_type === 'xp_total') current = (db.prepare('SELECT xp AS count FROM users WHERE id=?').get(userId) as { count: number } | undefined)?.count || 0;
      if (current >= item.condition_value) {
        db.prepare('INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)')
          .run(userId, item.id, new Date().toISOString());
      }
    }
  } catch (e) {
    console.error('Error awarding achievements:', e);
  }
}

// ---------------- PROGRESS & DASHBOARD ----------------
apiRouter.get('/api/progress', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const user = db.prepare('SELECT id, username, level, xp, coins, streak FROM users WHERE id = ?').get(userId) as any;
    
    const completedCount = db.prepare(`SELECT COUNT(*) as count FROM user_progress p JOIN missions m ON m.id=p.mission_id WHERE p.user_id = ? AND p.status = 'completed' AND m.status='published'`).get(userId) as any;
    const totalMissions = db.prepare("SELECT COUNT(*) as count FROM missions WHERE status='published'").get() as any;

    // Categories completion progress
    const categories = ['Network Fundamentals', 'IP Addressing', 'Switching', 'VLAN', 'Routing', 'Troubleshooting', 'Security'];
    const categoryStats = categories.map((cat) => {
      const totalInCat = db.prepare(`
        SELECT COUNT(*) as count FROM missions 
        WHERE status='published' AND (category = ? OR stage_name = ? OR (category = 'Fundamental' AND ? = 'Network Fundamentals'))
      `).get(cat, cat, cat) as any;

      const completedInCat = db.prepare(`
        SELECT COUNT(*) as count FROM missions m
        JOIN user_progress p ON m.id = p.mission_id
        WHERE p.user_id = ? AND p.status = 'completed' AND m.status='published'
        AND (m.category = ? OR m.stage_name = ? OR (m.category = 'Fundamental' AND ? = 'Network Fundamentals'))
      `).get(userId, cat, cat, cat) as any;

      const total = totalInCat.count || 1;
      const done = completedInCat.count || 0;
      const percentage = Math.min(100, Math.round((done / total) * 100));

      return {
        category: cat,
        total,
        completed: done,
        percentage
      };
    });

    // Continue Learning mission (first in_progress or unlocked not yet completed)
    let continueMission = db.prepare(`
      SELECT m.id, m.title, m.category, m.difficulty, m.xp_reward, m.estimated_time, p.status, COALESCE(p.score, 65) as score
      FROM missions m
      JOIN user_progress p ON m.id = p.mission_id
      WHERE p.user_id = ? AND m.status='published' AND (p.status = 'in_progress' OR p.status = 'unlocked')
      ORDER BY p.status DESC, m.order_index ASC
      LIMIT 1
    `).get(userId) as any;

    if (!continueMission) {
      continueMission = db.prepare("SELECT id, title, category, difficulty, xp_reward, estimated_time FROM missions WHERE status='published' ORDER BY order_index LIMIT 1").get() as any;
      if (continueMission) continueMission.score = 0;
    }

    // Recommended Missions
    const recommendedMissionsWithSecrets = db.prepare(`
      SELECT m.*, COALESCE(p.status, 'unlocked') as status, COALESCE(p.score, 0) as score
      FROM missions m
      LEFT JOIN user_progress p ON m.id = p.mission_id AND p.user_id = ?
      WHERE m.status='published' AND (p.status != 'completed' OR p.status IS NULL)
      ORDER BY m.order_index ASC
      LIMIT 4
    `).all(userId) as any[];
    const recommendedMissions = recommendedMissionsWithSecrets.map(({ target_flag: _targetFlag, ...mission }) => mission);

    res.json({
      user,
      stats: {
        level: user?.level || 1,
        totalXp: user?.xp || 0,
        completedMissions: completedCount.count,
        totalMissions: totalMissions.count,
        flagsCaptured: completedCount.count,
        currentStreak: user?.streak || 1
      },
      continueMission: continueMission ? {
        ...continueMission,
        progress: continueMission.score || 50
      } : null,
      categories: categoryStats,
      recommendedMissions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- LEARNING PATHS ----------------
apiRouter.get('/api/learning-paths', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const paths = db.prepare(`SELECT id,name,slug,description,order_index AS orderIndex
      FROM learning_paths WHERE status='published' ORDER BY order_index,id`).all() as any[];
    const result = paths.map((path) => {
      const stages = db.prepare(`SELECT id,name,description,icon,accent,order_index AS orderIndex,
        prerequisite_stage_id AS prerequisiteStageId FROM learning_path_stages WHERE learning_path_id=? ORDER BY order_index,id`).all(path.id) as any[];
      return {
        ...path,
        stages: stages.map((stage) => {
          let prerequisiteMet = true;
          if (stage.prerequisiteStageId) {
            const counts = db.prepare(`SELECT COUNT(m.id) AS total,
              SUM(CASE WHEN p.status='completed' THEN 1 ELSE 0 END) AS completed
              FROM missions m LEFT JOIN user_progress p ON p.mission_id=m.id AND p.user_id=?
              WHERE m.learning_path_stage_id=? AND m.status='published'`).get(userId, stage.prerequisiteStageId) as { total: number; completed: number | null };
            prerequisiteMet = counts.total === 0 || counts.total === (counts.completed || 0);
          }
          const missions = db.prepare(`SELECT m.*,
            COALESCE(p.status,CASE WHEN m.order_index=1 THEN 'unlocked' ELSE 'locked' END) AS user_status,
            COALESCE(p.score,0) AS score,COALESCE(p.xp_earned,0) AS xp_earned,p.completed_at
            FROM missions m LEFT JOIN user_progress p ON p.mission_id=m.id AND p.user_id=?
            WHERE m.learning_path_stage_id=? AND m.status='published'
            ORDER BY COALESCE(m.path_order_index,m.order_index),m.id`).all(userId, stage.id) as any[];
          const publicMissions = missions.map(({ target_flag: _targetFlag, user_status: userStatus, ...mission }) => ({
            ...mission,
            status: prerequisiteMet || userStatus === 'completed' ? userStatus : 'locked',
            completionPercentage: userStatus === 'completed' ? 100 : userStatus === 'in_progress' ? mission.score || 50 : 0,
          }));
          return { ...stage, prerequisiteMet, missions: publicMissions };
        }),
      };
    });
    res.json({ paths: result });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ---------------- ACHIEVEMENTS ----------------
apiRouter.get('/api/achievements', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const achievements = db.prepare(`
      SELECT 
        a.*,
        CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
        ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE a.is_active = 1
      ORDER BY a.id ASC
    `).all(userId);

    res.json({ achievements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- LEADERBOARD ----------------
apiRouter.get('/api/leaderboard', (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.level, u.xp, u.coins, u.streak,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_missions,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as flags_captured
      FROM users u
      LEFT JOIN user_progress p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.xp DESC, completed_missions DESC, u.id ASC
    `).all() as any[];

    const ranked = users.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      username: u.username,
      level: u.level,
      xp: u.xp,
      flags: u.flags_captured,
      completedMissions: u.completed_missions,
      isCurrentUser: u.id === currentUserId
    }));

    res.json({ leaderboard: ranked });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ASSESSMENT (PRE-TEST / POST-TEST) ----------------
apiRouter.get('/api/assessment/questions', (req, res) => {
  try {
    const assessmentType = String(req.query.type || 'posttest').toLowerCase();
    if (assessmentType !== 'pretest' && assessmentType !== 'posttest') return res.status(400).json({ error: 'Invalid assessment type' });
    const assessment = db.prepare(`SELECT id,title,assessment_type AS assessmentType,description
      FROM assessments WHERE assessment_type=? AND is_active=1 ORDER BY updated_at DESC,id DESC LIMIT 1`).get(assessmentType) as { id: number; title: string; assessmentType: string; description: string } | undefined;
    if (!assessment) return res.json({ assessment: null, questions: [] });
    const questions = db.prepare(`SELECT question.id,question.category,question.question,
      question.option_a,question.option_b,question.option_c,question.option_d
      FROM assessment_question_assignments map JOIN assessment_questions question ON question.id=map.question_id
      WHERE map.assessment_id=? ORDER BY map.order_index,question.id`).all(assessment.id);
    res.json({ assessment, questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function submitAssessment(req: Request, res: import('express').Response, assessmentType: 'pretest' | 'posttest') {
  try {
    const userId = getCurrentUserId(req);
    const submittedAnswers = req.body.answers as Record<string, string> | undefined;
    const assessment = db.prepare(`SELECT id FROM assessments WHERE assessment_type=? AND is_active=1
      ORDER BY updated_at DESC,id DESC LIMIT 1`).get(assessmentType) as { id: number } | undefined;
    if (!assessment) return res.status(409).json({ error: `No active ${assessmentType} assessment` });
    const allQuestions = db.prepare(`SELECT question.id,question.correct_answer FROM assessment_question_assignments map
      JOIN assessment_questions question ON question.id=map.question_id WHERE map.assessment_id=? ORDER BY map.order_index`).all(assessment.id) as any[];
    if (allQuestions.length === 0) return res.status(409).json({ error: 'The active assessment has no questions' });
    if (!submittedAnswers || allQuestions.some((question) => !assessmentAnswerOptions.has(String(submittedAnswers[question.id] || '').toUpperCase()))) {
      return res.status(400).json({ error: 'Answer every assessment question with A, B, C, or D' });
    }
    let correctCount = 0;
    allQuestions.forEach((question) => { if (String(submittedAnswers[question.id]).toUpperCase() === question.correct_answer.toUpperCase()) correctCount += 1; });
    const scorePercentage = Math.round((correctCount / allQuestions.length) * 100);
    db.prepare(`
      INSERT INTO assessment_results (user_id, assessment_id, assessment_type, score, total_questions, correct_answers, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, assessment.id, assessmentType, scorePercentage, allQuestions.length, correctCount, new Date().toISOString());
    logActivity(userId, assessmentType === 'pretest' ? 'PRETEST_COMPLETED' : 'POSTTEST_COMPLETED', 'assessment', assessment.id, { score: scorePercentage });
    res.json({
      assessmentType,
      assessmentId: assessment.id,
      score: scorePercentage,
      correctCount,
      totalQuestions: allQuestions.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

apiRouter.post('/api/assessment/pretest', (req, res) => submitAssessment(req, res, 'pretest'));
apiRouter.post('/api/assessment/posttest', (req, res) => submitAssessment(req, res, 'posttest'));

apiRouter.get('/api/assessment/results', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const pretest = db.prepare(`
      SELECT score, completed_at FROM assessment_results
      WHERE user_id = ? AND assessment_type = 'pretest'
      ORDER BY id DESC LIMIT 1
    `).get(userId) as any;

    const posttest = db.prepare(`
      SELECT score, completed_at FROM assessment_results
      WHERE user_id = ? AND assessment_type = 'posttest'
      ORDER BY id DESC LIMIT 1
    `).get(userId) as any;

    const preScore = pretest ? pretest.score : null;
    const postScore = posttest ? posttest.score : null;
    const improvement = preScore !== null && postScore !== null ? postScore - preScore : null;

    res.json({
      pretest: preScore !== null ? { score: preScore, completedAt: pretest.completed_at } : null,
      posttest: postScore !== null ? { score: postScore, completedAt: posttest.completed_at } : null,
      improvement
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CISCO PACKET TRACER LAB DOWNLOAD ----------------
function sendLegacyLab(res: import('express').Response, filename: string) {
  // Keep the original generated lab response available for seeded/legacy records.
  const labContent = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Cisco Packet Tracer Activity File (Simulated Lab) -->
<!-- Network Engineer Capture The Flag Capstone Project -->
<PACKET_TRACER_ACTIVITY version="8.2.0">
  <HEADER>
    <TITLE>${filename.replace('.pka', '').replace(/_/g, ' ').toUpperCase()}</TITLE>
    <AUTHOR>Network CTF Engineering Lab</AUTHOR>
    <TIMESTAMP>${new Date().toISOString()}</TIMESTAMP>
    <TARGET_FLAG>FLAG{CHECK_MISSION_ROOM_FOR_VALIDATION}</TARGET_FLAG>
  </HEADER>
  <INSTRUCTIONS>
    <![CDATA[
    === CISCO PACKET TRACER LAB INSTRUCTIONS ===
    Lab File: ${filename}

    INSPECTION OBJECTIVES:
    1. Verify Layer 1 Physical connectivity (green link status indicators).
    2. Open command prompts on workstations and verify:
       - IPv4 Address and CIDR Subnet Mask
       - Default Gateway matching router interface IP
       - DNS Resolver Reachability
    3. Console into switches and routers:
       - show ip interface brief
       - show running-config
       - show interfaces trunk
       - show vlan brief
       - show ip route
       - show ip ospf neighbor
    4. Resolve all identified defects and confirm end-to-end ping.
    5. Return to the Network CTF Mission Room to submit your Root Cause & Flag!
    ]]>
  </INSTRUCTIONS>
  <SIMULATION_PAYLOAD>
    BASE64_ENCODED_PACKET_TRACER_BINARY_DATA_SIMULATION_STUB
  </SIMULATION_PAYLOAD>
</PACKET_TRACER_ACTIVITY>
`;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.attachment(filename);
  res.send(labContent);
}

apiRouter.get('/api/download/lab/mission/:missionId', (req, res) => {
  const missionId = Number(req.params.missionId);
  const userId = getCurrentUserId(req);
  const mission = db.prepare("SELECT id, packet_tracer_file FROM missions WHERE id = ? AND status = 'published' AND trim(packet_tracer_file) != ''")
    .get(missionId) as { id: number; packet_tracer_file: string } | undefined;
  if (!mission) return res.status(404).json({ error: 'Published lab not found' });
  const lab = getStoredLabForMission(mission.id);
  if (lab) {
    if (!sendStoredLab(res, lab)) return res.status(410).json({ error: 'Stored lab file is missing' });
  } else {
    sendLegacyLab(res, mission.packet_tracer_file);
  }
  logActivity(userId, 'PACKET_TRACER_DOWNLOADED', 'mission', mission.id, { filename: mission.packet_tracer_file });
  checkAndAwardAchievements(userId);
});

apiRouter.get('/api/download/lab/:filename', (req, res) => {
  const filename = req.params.filename;
  const userId = getCurrentUserId(req);
  const mission = db.prepare("SELECT id FROM missions WHERE packet_tracer_file = ? AND status = 'published'").get(filename) as { id: number } | undefined;
  if (!mission) return res.status(404).json({ error: 'Published lab not found' });
  const lab = getStoredLabForMission(mission.id);
  if (lab) {
    if (!sendStoredLab(res, lab)) return res.status(410).json({ error: 'Stored lab file is missing' });
  } else {
    sendLegacyLab(res, filename);
  }
  logActivity(userId, 'PACKET_TRACER_DOWNLOADED', 'mission', mission.id, { filename });
  checkAndAwardAchievements(userId);
});
