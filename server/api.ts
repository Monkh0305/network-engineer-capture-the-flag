import { Router } from 'express';
import { db, initDatabase } from './db.ts';

// Ensure DB is initialized
initDatabase();

export const apiRouter = Router();

// Helper to get active user (defaults to cadet_networker if no auth header passed)
function getCurrentUserId(req: any): number {
  const authHeader = req.headers['x-user-id'];
  if (authHeader && !isNaN(Number(authHeader))) {
    return Number(authHeader);
  }
  const defaultUser = db.prepare('SELECT id FROM users WHERE username = ?').get('cadet_networker') as { id: number } | undefined;
  return defaultUser ? defaultUser.id : 1;
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
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, level, xp, coins, streak, created_at)
      VALUES (?, ?, ?, 1, 0, 100, 1, ?)
    `);
    const result = insertUser.run(username, email, password, new Date().toISOString());
    const userId = Number(result.lastInsertRowid);

    // Initialize missions progress: Mission 1 unlocked, others locked
    const missions = db.prepare('SELECT id, order_index FROM missions ORDER BY order_index ASC').all() as { id: number; order_index: number }[];
    const insertProg = db.prepare(`
      INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned, completed_at)
      VALUES (?, ?, ?, 0, 0, NULL)
    `);

    missions.forEach((m) => {
      insertProg.run(userId, m.id, m.order_index === 1 ? 'unlocked' : 'locked');
    });

    const user = db.prepare('SELECT id, username, email, level, xp, coins, streak, created_at FROM users WHERE id = ?').get(userId);
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT id, username, email, password_hash, level, xp, coins, streak, created_at FROM users WHERE email = ? OR username = ?')
      .get(email, email) as any;

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials. For demo, try student@capstone.edu / demo123' });
    }

    delete user.password_hash;
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/auth/me', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const user = db.prepare('SELECT id, username, email, level, xp, coins, streak, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
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

      return {
        ...m,
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
      WHERE m.id = ?
    `).get(userId, missionId) as any;

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const tasks = db.prepare('SELECT * FROM mission_tasks WHERE mission_id = ? ORDER BY order_index ASC').all(missionId);
    
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

    res.json({
      mission: {
        ...mission,
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

    const question = db.prepare('SELECT * FROM questions WHERE id = ? AND mission_id = ?').get(questionId, missionId) as any;
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

    const hint = db.prepare('SELECT * FROM hints WHERE id = ? AND mission_id = ?').get(hintId, missionId) as any;
    if (!hint) {
      return res.status(404).json({ error: 'Hint not found' });
    }

    // Check if already used
    const used = db.prepare('SELECT id FROM user_hints WHERE user_id = ? AND hint_id = ?').get(userId, hintId);
    if (!used) {
      db.prepare('INSERT INTO user_hints (user_id, hint_id, used_at) VALUES (?, ?, ?)')
        .run(userId, hintId, new Date().toISOString());
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

    const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(missionId) as any;
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Verify flag
    const normalizedSubmitted = (submittedFlag || '').trim();
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
    const coinsReward = 500;

    // Check if already completed
    const existingProg = db.prepare('SELECT status, xp_earned FROM user_progress WHERE user_id = ? AND mission_id = ?').get(userId, missionId) as any;
    const isFirstTimeCompletion = !existingProg || existingProg.status !== 'completed';

    // Mark mission completed
    db.prepare(`
      INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned, completed_at)
      VALUES (?, ?, 'completed', 100, ?, ?)
      ON CONFLICT(user_id, mission_id) DO UPDATE SET 
        status = 'completed',
        score = 100,
        xp_earned = ?,
        completed_at = ?
    `).run(userId, missionId, finalXp, new Date().toISOString(), finalXp, new Date().toISOString());

    // Unlock next mission in sequence
    const nextMission = db.prepare('SELECT id FROM missions WHERE order_index = ?').get(mission.order_index + 1) as any;
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
    }

    // Check achievements
    checkAndAwardAchievements(userId);

    const updatedUser = db.prepare('SELECT id, username, level, xp, coins, streak FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: 'MISSION COMPLETE! Flag verified.',
      flag: mission.target_flag,
      xpEarned: finalXp,
      coinsEarned: coinsReward,
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
    const completedCount = db.prepare(`SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed'`).get(userId) as any;
    
    // Award First Connection
    if (completedCount.count >= 1) {
      const ach = db.prepare('SELECT id FROM achievements WHERE slug = ?').get('first_connection') as any;
      if (ach) {
        db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)')
          .run(userId, ach.id, new Date().toISOString());
      }
    }

    // Award Master Troubleshooter
    if (completedCount.count >= 5) {
      const ach = db.prepare('SELECT id FROM achievements WHERE slug = ?').get('troubleshooter') as any;
      if (ach) {
        db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)')
          .run(userId, ach.id, new Date().toISOString());
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
    
    const completedCount = db.prepare(`SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed'`).get(userId) as any;
    const totalMissions = db.prepare('SELECT COUNT(*) as count FROM missions').get() as any;

    // Categories completion progress
    const categories = ['Network Fundamentals', 'IP Addressing', 'Switching', 'VLAN', 'Routing', 'Troubleshooting', 'Security'];
    const categoryStats = categories.map((cat) => {
      const totalInCat = db.prepare(`
        SELECT COUNT(*) as count FROM missions 
        WHERE category = ? OR stage_name = ? OR (category = 'Fundamental' AND ? = 'Network Fundamentals')
      `).get(cat, cat, cat) as any;

      const completedInCat = db.prepare(`
        SELECT COUNT(*) as count FROM missions m
        JOIN user_progress p ON m.id = p.mission_id
        WHERE p.user_id = ? AND p.status = 'completed' 
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
      WHERE p.user_id = ? AND (p.status = 'in_progress' OR p.status = 'unlocked')
      ORDER BY p.status DESC, m.order_index ASC
      LIMIT 1
    `).get(userId) as any;

    if (!continueMission) {
      continueMission = db.prepare('SELECT id, title, category, difficulty, xp_reward, estimated_time FROM missions WHERE order_index = 1').get() as any;
      if (continueMission) continueMission.score = 0;
    }

    // Recommended Missions
    const recommendedMissions = db.prepare(`
      SELECT m.*, COALESCE(p.status, 'unlocked') as status, COALESCE(p.score, 0) as score
      FROM missions m
      LEFT JOIN user_progress p ON m.id = p.mission_id AND p.user_id = ?
      WHERE p.status != 'completed' OR p.status IS NULL
      ORDER BY m.order_index ASC
      LIMIT 4
    `).all(userId) as any[];

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
    const questions = db.prepare('SELECT id, category, question, option_a, option_b, option_c, option_d FROM assessment_questions ORDER BY id ASC').all();
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/assessment/pretest', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { answers } = req.body; // map of questionId -> selectedOption

    const allQuestions = db.prepare('SELECT id, correct_answer FROM assessment_questions').all() as any[];
    let correctCount = 0;

    allQuestions.forEach((q) => {
      if (answers && answers[q.id] && answers[q.id].toUpperCase() === q.correct_answer.toUpperCase()) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / allQuestions.length) * 100);

    db.prepare(`
      INSERT INTO assessment_results (user_id, assessment_type, score, total_questions, completed_at)
      VALUES (?, 'pretest', ?, ?, ?)
    `).run(userId, scorePercentage, allQuestions.length, new Date().toISOString());

    res.json({
      assessmentType: 'pretest',
      score: scorePercentage,
      correctCount,
      totalQuestions: allQuestions.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/assessment/posttest', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { answers } = req.body;

    const allQuestions = db.prepare('SELECT id, correct_answer FROM assessment_questions').all() as any[];
    let correctCount = 0;

    allQuestions.forEach((q) => {
      if (answers && answers[q.id] && answers[q.id].toUpperCase() === q.correct_answer.toUpperCase()) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / allQuestions.length) * 100);

    db.prepare(`
      INSERT INTO assessment_results (user_id, assessment_type, score, total_questions, completed_at)
      VALUES (?, 'posttest', ?, ?, ?)
    `).run(userId, scorePercentage, allQuestions.length, new Date().toISOString());

    res.json({
      assessmentType: 'posttest',
      score: scorePercentage,
      correctCount,
      totalQuestions: allQuestions.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

    const preScore = pretest ? pretest.score : 55; // Default baseline 55% for academic capstone demo
    const postScore = posttest ? posttest.score : null;
    const improvement = postScore !== null ? postScore - preScore : null;

    res.json({
      pretest: { score: preScore, completedAt: pretest?.completed_at || 'Pre-Learning Baseline' },
      posttest: postScore !== null ? { score: postScore, completedAt: posttest.completed_at } : null,
      improvement
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CISCO PACKET TRACER LAB DOWNLOAD ----------------
apiRouter.get('/api/download/lab/:filename', (req, res) => {
  const filename = req.params.filename;
  // Generate downloadable Cisco Packet Tracer simulated activity manifest
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
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(labContent);
});
