import { Router } from 'express';
import { db } from './db.ts';
import { deleteStoredLabFile, getStoredLabForMission } from './adminPacketTracer.ts';
import { logActivity } from './activity.ts';
import { getAuthenticatedUser } from './auth.ts';

export const adminMissionsRouter = Router();

const categories = new Set(['Network Fundamentals', 'IP Addressing', 'Switching', 'VLAN', 'Routing', 'Troubleshooting', 'Security']);
const difficulties = new Set(['easy', 'medium', 'hard']);
const statuses = new Set(['draft', 'published', 'archived']);
const taskTypes = new Set(['scenario', 'diagram', 'lab', 'investigation', 'questions', 'flag']);
const sortColumns: Record<string, string> = {
  missionNumber: 'mission_number', title: 'title', category: 'category', difficulty: 'difficulty',
  status: 'status', xpReward: 'xp_reward', orderIndex: 'order_index', updatedAt: 'updated_at',
};

const missionSelect = `
  id, mission_number AS missionNumber, title, slug, description, scenario_text AS scenario,
  category, lower(difficulty) AS difficulty, estimated_minutes AS estimatedMinutes,
  xp_reward AS xpReward, coin_reward AS coinReward, target_flag AS flag, status,
  order_index AS orderIndex, learning_path_id AS learningPathId,
  packet_tracer_file AS packetTracerFile, created_at AS createdAt, updated_at AS updatedAt
`;

function normalizedSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueSlug(requested: string, excludeId?: number): string {
  const base = normalizedSlug(requested) || 'mission';
  let candidate = base;
  let suffix = 2;
  while (db.prepare(`SELECT id FROM missions WHERE slug = ? ${excludeId ? 'AND id != ?' : ''}`).get(...(excludeId ? [candidate, excludeId] : [candidate]))) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

function validateMission(body: any) {
  const missionNumber = Number(body.missionNumber);
  const estimatedMinutes = Number(body.estimatedMinutes);
  const xpReward = Number(body.xpReward);
  const coinReward = Number(body.coinReward);
  const orderIndex = Number(body.orderIndex);
  if (!Number.isInteger(missionNumber) || missionNumber <= 0) return 'Mission number must be a positive integer';
  if (typeof body.title !== 'string' || !body.title.trim()) return 'Title is required';
  if (typeof body.description !== 'string' || !body.description.trim()) return 'Description is required';
  if (typeof body.scenario !== 'string' || !body.scenario.trim()) return 'Scenario is required';
  if (!categories.has(body.category)) return 'Invalid category';
  if (!difficulties.has(body.difficulty)) return 'Invalid difficulty';
  if (!statuses.has(body.status)) return 'Invalid status';
  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes <= 0) return 'Estimated minutes must be positive';
  if (!Number.isInteger(xpReward) || xpReward < 0 || !Number.isInteger(coinReward) || coinReward < 0) return 'Rewards must be non-negative integers';
  if (!Number.isInteger(orderIndex) || orderIndex <= 0) return 'Order index must be positive';
  if (body.learningPathId !== '' && body.learningPathId !== null && body.learningPathId !== undefined
    && (!Number.isInteger(Number(body.learningPathId)) || Number(body.learningPathId) <= 0)) return 'Learning path id must be positive';
  if (typeof body.flag !== 'string' || !/^FLAG\{.+\}$/i.test(body.flag.trim())) return 'Flag must use FLAG{...} format';
  return null;
}

function missionValues(body: any) {
  const now = new Date().toISOString();
  const difficulty = body.difficulty[0].toUpperCase() + body.difficulty.slice(1);
  const learningPathId = body.learningPathId === '' || body.learningPathId === null || body.learningPathId === undefined ? null : Number(body.learningPathId);
  return {
    missionNumber: Number(body.missionNumber), title: body.title.trim(), slug: uniqueSlug(body.slug || body.title, body.id),
    description: body.description.trim(), scenario: body.scenario.trim(), category: body.category, difficulty,
    estimatedMinutes: Number(body.estimatedMinutes), xpReward: Number(body.xpReward), coinReward: Number(body.coinReward),
    flag: body.flag.trim(), status: body.status, orderIndex: Number(body.orderIndex), learningPathId,
    packetTracerFile: String(body.packetTracerFile || '').trim(), now,
  };
}

adminMissionsRouter.get('/', (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || 1), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize || 10), 10) || 10));
    const search = String(req.query.search || '').trim();
    const category = categories.has(String(req.query.category)) ? String(req.query.category) : 'all';
    const difficulty = difficulties.has(String(req.query.difficulty)) ? String(req.query.difficulty) : 'all';
    const status = statuses.has(String(req.query.status)) ? String(req.query.status) : 'all';
    const sortBy = sortColumns[String(req.query.sortBy)] ? String(req.query.sortBy) : 'orderIndex';
    const sortOrder = String(req.query.sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const conditions: string[] = [];
    const parameters: Array<string | number> = [];
    if (search) { conditions.push('(title LIKE ? OR slug LIKE ? OR description LIKE ?)'); parameters.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category !== 'all') { conditions.push('category = ?'); parameters.push(category); }
    if (difficulty !== 'all') { conditions.push('lower(difficulty) = ?'); parameters.push(difficulty); }
    if (status !== 'all') { conditions.push('status = ?'); parameters.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) AS total FROM missions ${where}`).get(...parameters) as { total: number }).total;
    const missions = db.prepare(`SELECT ${missionSelect},
      (SELECT COUNT(*) FROM mission_tasks task WHERE task.mission_id = missions.id) AS taskCount
      FROM missions ${where} ORDER BY ${sortColumns[sortBy]} ${sortOrder}, id ASC LIMIT ? OFFSET ?
    `).all(...parameters, pageSize, (page - 1) * pageSize);
    res.json({ missions, filters: { categories: [...categories] }, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const mission = db.prepare(`SELECT ${missionSelect} FROM missions WHERE id = ?`).get(id);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    const tasks = db.prepare(`SELECT id, mission_id AS missionId, task_type AS taskType, title, content,
      order_index AS orderIndex, is_enabled AS isEnabled FROM mission_tasks WHERE mission_id = ? ORDER BY order_index, id`).all(id);
    res.json({ mission, tasks });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.post('/', (req, res) => {
  try {
    const validationError = validateMission(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const values = missionValues(req.body);
    const result = db.prepare(`
      INSERT INTO missions (
        mission_number, title, slug, description, difficulty, xp_reward, coin_reward, category,
        stage, stage_name, estimated_time, estimated_minutes, packet_tracer_file, order_index,
        learning_path_id, incident_id, department, reported_time, priority, scenario_text,
        target_flag, topology_json, checklists_json, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{"nodes":[],"links":[]}', '[]', ?, ?, ?)
    `).run(values.missionNumber, values.title, values.slug, values.description, values.difficulty,
      values.xpReward, values.coinReward, values.category, values.learningPathId || 1, values.category,
      `${values.estimatedMinutes} min`, values.estimatedMinutes, values.packetTracerFile, values.orderIndex,
      values.learningPathId, `ADMIN-${Date.now()}`, 'Training Lab', values.now, 'Medium', values.scenario,
      values.flag, values.status, values.now, values.now);
    const id = Number(result.lastInsertRowid);
    logActivity(getAuthenticatedUser(req).id, 'ADMIN_MISSION_CREATED', 'mission', id, { title: values.title });
    res.status(201).json({ mission: db.prepare(`SELECT ${missionSelect} FROM missions WHERE id = ?`).get(id) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!db.prepare('SELECT id FROM missions WHERE id = ?').get(id)) return res.status(404).json({ error: 'Mission not found' });
    const validationError = validateMission(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const values = missionValues({ ...req.body, id });
    db.prepare(`UPDATE missions SET mission_number=?, title=?, slug=?, description=?, difficulty=?, xp_reward=?, coin_reward=?,
      category=?, stage=?, stage_name=?, estimated_time=?, estimated_minutes=?, packet_tracer_file=?, order_index=?,
      learning_path_id=?, scenario_text=?, target_flag=?, status=?, updated_at=? WHERE id=?
    `).run(values.missionNumber, values.title, values.slug, values.description, values.difficulty, values.xpReward,
      values.coinReward, values.category, values.learningPathId || 1, values.category, `${values.estimatedMinutes} min`,
      values.estimatedMinutes, values.packetTracerFile, values.orderIndex, values.learningPathId, values.scenario,
      values.flag, values.status, values.now, id);
    logActivity(getAuthenticatedUser(req).id, 'ADMIN_MISSION_UPDATED', 'mission', id, { title: values.title });
    res.json({ mission: db.prepare(`SELECT ${missionSelect} FROM missions WHERE id = ?`).get(id) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.post('/:id/duplicate', (req, res) => {
  try {
    const id = Number(req.params.id);
    const source = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as any;
    if (!source) return res.status(404).json({ error: 'Mission not found' });
    const maxValues = db.prepare('SELECT COALESCE(MAX(order_index), 0) AS orderIndex, COALESCE(MAX(mission_number), 0) AS missionNumber FROM missions').get() as { orderIndex: number; missionNumber: number };
    const now = new Date().toISOString();
    db.exec('BEGIN');
    const result = db.prepare(`INSERT INTO missions (
      mission_number,title,slug,description,difficulty,xp_reward,coin_reward,category,stage,stage_name,
      estimated_time,estimated_minutes,packet_tracer_file,order_index,learning_path_id,incident_id,department,
      reported_time,priority,scenario_text,target_flag,topology_json,checklists_json,status,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      maxValues.missionNumber + 1, `${source.title} (Copy)`, uniqueSlug(`${source.slug}-copy`), source.description,
      source.difficulty, source.xp_reward, source.coin_reward, source.category, source.stage, source.stage_name,
      source.estimated_time, source.estimated_minutes, source.packet_tracer_file, maxValues.orderIndex + 1,
      source.learning_path_id, `COPY-${Date.now()}`, source.department, now, source.priority, source.scenario_text,
      source.target_flag, source.topology_json, source.checklists_json, 'draft', now, now);
    const newId = Number(result.lastInsertRowid);
    db.prepare(`INSERT INTO mission_tasks (mission_id, task_type, title, content, order_index, is_enabled)
      SELECT ?, task_type, title, content, order_index, is_enabled FROM mission_tasks WHERE mission_id = ?`).run(newId, id);
    db.prepare(`INSERT INTO questions (mission_id, question, option_a, option_b, option_c, option_d, correct_answer, root_cause, explanation)
      SELECT ?, question, option_a, option_b, option_c, option_d, correct_answer, root_cause, explanation FROM questions WHERE mission_id = ?`).run(newId, id);
    db.prepare(`INSERT INTO hints (mission_id, hint_order, hint_text, xp_penalty)
      SELECT ?, hint_order, hint_text, xp_penalty FROM hints WHERE mission_id = ?`).run(newId, id);
    db.exec('COMMIT');
    res.status(201).json({ mission: db.prepare(`SELECT ${missionSelect} FROM missions WHERE id = ?`).get(newId) });
  } catch (error: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.patch('/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!statuses.has(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    const result = db.prepare('UPDATE missions SET status = ?, updated_at = ? WHERE id = ?').run(req.body.status, new Date().toISOString(), id);
    if (!result.changes) return res.status(404).json({ error: 'Mission not found' });
    res.json({ mission: db.prepare(`SELECT ${missionSelect} FROM missions WHERE id = ?`).get(id) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.post('/:id/reorder', (req, res) => {
  const id = Number(req.params.id);
  const direction = req.body.direction;
  if (direction !== 'up' && direction !== 'down') return res.status(400).json({ error: 'Direction must be up or down' });
  const mission = db.prepare('SELECT id, order_index FROM missions WHERE id = ?').get(id) as { id: number; order_index: number } | undefined;
  if (!mission) return res.status(404).json({ error: 'Mission not found' });
  const neighbor = db.prepare(`SELECT id, order_index FROM missions WHERE order_index ${direction === 'up' ? '<' : '>'} ? ORDER BY order_index ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`).get(mission.order_index) as { id: number; order_index: number } | undefined;
  if (!neighbor) return res.json({ changed: false });
  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE missions SET order_index = ?, updated_at = ? WHERE id = ?').run(neighbor.order_index, now, mission.id);
    db.prepare('UPDATE missions SET order_index = ?, updated_at = ? WHERE id = ?').run(mission.order_index, now, neighbor.id);
    db.exec('COMMIT');
    res.json({ changed: true });
  } catch (error: any) { db.exec('ROLLBACK'); res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const deletedMission = db.prepare('SELECT id,title FROM missions WHERE id = ?').get(id) as {id:number;title:string}|undefined;
  if (!deletedMission) return res.status(404).json({ error: 'Mission not found' });
  const storedLab = getStoredLabForMission(id);
  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM packet_tracer_labs WHERE mission_id = ?').run(id);
    db.prepare('DELETE FROM user_answers WHERE question_id IN (SELECT id FROM questions WHERE mission_id = ?)').run(id);
    db.prepare('DELETE FROM user_hints WHERE hint_id IN (SELECT id FROM hints WHERE mission_id = ?)').run(id);
    db.prepare('DELETE FROM user_progress WHERE mission_id = ?').run(id);
    db.prepare('DELETE FROM user_learning_sessions WHERE mission_id = ?').run(id);
    db.prepare('DELETE FROM mission_tasks WHERE mission_id = ?').run(id);
    db.prepare('DELETE FROM questions WHERE mission_id = ?').run(id);
    db.prepare('DELETE FROM hints WHERE mission_id = ?').run(id);
    db.prepare('DELETE FROM missions WHERE id = ?').run(id);
    db.exec('COMMIT');
    deleteStoredLabFile(storedLab?.stored_filename);
    logActivity(getAuthenticatedUser(req).id, 'ADMIN_MISSION_DELETED', 'mission', id, { title: deletedMission.title });
    res.json({ success: true });
  } catch (error: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.post('/:id/tasks', (req, res) => {
  try {
    const missionId = Number(req.params.id);
    if (!db.prepare('SELECT id FROM missions WHERE id = ?').get(missionId)) return res.status(404).json({ error: 'Mission not found' });
    if (!taskTypes.has(req.body.taskType) || typeof req.body.title !== 'string' || !req.body.title.trim()) return res.status(400).json({ error: 'Valid task type and title are required' });
    const order = (db.prepare('SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM mission_tasks WHERE mission_id = ?').get(missionId) as { next: number }).next;
    const result = db.prepare('INSERT INTO mission_tasks (mission_id, task_type, title, content, order_index, is_enabled) VALUES (?, ?, ?, ?, ?, ?)')
      .run(missionId, req.body.taskType, req.body.title.trim(), String(req.body.content || ''), order, req.body.isEnabled === false ? 0 : 1);
    res.status(201).json({ taskId: Number(result.lastInsertRowid) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.put('/:id/tasks/:taskId', (req, res) => {
  try {
    const missionId = Number(req.params.id); const taskId = Number(req.params.taskId);
    if (!taskTypes.has(req.body.taskType) || typeof req.body.title !== 'string' || !req.body.title.trim()) return res.status(400).json({ error: 'Valid task type and title are required' });
    const result = db.prepare('UPDATE mission_tasks SET task_type=?, title=?, content=?, is_enabled=? WHERE id=? AND mission_id=?')
      .run(req.body.taskType, req.body.title.trim(), String(req.body.content || ''), req.body.isEnabled === false ? 0 : 1, taskId, missionId);
    if (!result.changes) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.patch('/:id/tasks/:taskId/enabled', (req, res) => {
  const result = db.prepare('UPDATE mission_tasks SET is_enabled=? WHERE id=? AND mission_id=?')
    .run(req.body.isEnabled === true ? 1 : 0, Number(req.params.taskId), Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

adminMissionsRouter.post('/:id/tasks/:taskId/reorder', (req, res) => {
  const missionId = Number(req.params.id); const taskId = Number(req.params.taskId); const direction = req.body.direction;
  if (direction !== 'up' && direction !== 'down') return res.status(400).json({ error: 'Direction must be up or down' });
  const task = db.prepare('SELECT id, order_index FROM mission_tasks WHERE id=? AND mission_id=?').get(taskId, missionId) as { id: number; order_index: number } | undefined;
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const neighbor = db.prepare(`SELECT id, order_index FROM mission_tasks WHERE mission_id=? AND order_index ${direction === 'up' ? '<' : '>'} ? ORDER BY order_index ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`).get(missionId, task.order_index) as { id: number; order_index: number } | undefined;
  if (!neighbor) return res.json({ changed: false });
  db.exec('BEGIN');
  try { db.prepare('UPDATE mission_tasks SET order_index=? WHERE id=?').run(neighbor.order_index, task.id); db.prepare('UPDATE mission_tasks SET order_index=? WHERE id=?').run(task.order_index, neighbor.id); db.exec('COMMIT'); res.json({ changed: true }); }
  catch (error: any) { db.exec('ROLLBACK'); res.status(500).json({ error: error.message }); }
});

adminMissionsRouter.delete('/:id/tasks/:taskId', (req, res) => {
  const result = db.prepare('DELETE FROM mission_tasks WHERE id=? AND mission_id=?').run(Number(req.params.taskId), Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});
