import { Router } from 'express';
import { db } from './db.ts';

export const adminLearningPathsRouter = Router();
const pathStatuses = new Set(['draft', 'published']);
const accents = new Set(['#22D3EE', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']);
const icons = new Set(['Network', 'Terminal', 'Route', 'AlertTriangle']);

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'learning-path';
}

function uniqueSlug(requested: string, excludeId?: number): string {
  const base = slugify(requested);
  let candidate = base; let suffix = 2;
  while (db.prepare(`SELECT id FROM learning_paths WHERE slug=? ${excludeId ? 'AND id != ?' : ''}`).get(...(excludeId ? [candidate, excludeId] : [candidate]))) candidate = `${base}-${suffix++}`;
  return candidate;
}

function pathDetail(pathId: number) {
  const path = db.prepare(`SELECT id, name, slug, description, status, order_index AS orderIndex,
    created_at AS createdAt, updated_at AS updatedAt FROM learning_paths WHERE id=?`).get(pathId) as any;
  if (!path) return null;
  path.stages = db.prepare(`SELECT id, learning_path_id AS learningPathId, name, description, icon, accent,
    order_index AS orderIndex, prerequisite_stage_id AS prerequisiteStageId
    FROM learning_path_stages WHERE learning_path_id=? ORDER BY order_index,id`).all(pathId) as any[];
  const missions = db.prepare(`SELECT id, mission_number AS missionNumber, title, status,
    learning_path_stage_id AS stageId, COALESCE(path_order_index,order_index) AS pathOrderIndex
    FROM missions WHERE learning_path_id=? ORDER BY learning_path_stage_id,pathOrderIndex,id`).all(pathId) as any[];
  path.stages = path.stages.map((stage: any) => ({ ...stage, missions: missions.filter((mission) => mission.stageId === stage.id) }));
  return path;
}

function syncStageMissionMetadata(pathId: number) {
  const stages = db.prepare('SELECT id,name,order_index FROM learning_path_stages WHERE learning_path_id=?').all(pathId) as unknown as Array<{ id: number; name: string; order_index: number }>;
  const update = db.prepare('UPDATE missions SET stage=?,stage_name=?,learning_path_id=? WHERE learning_path_stage_id=?');
  for (const stage of stages) update.run(stage.order_index, stage.name, pathId, stage.id);
}

adminLearningPathsRouter.get('/', (_req, res) => {
  try {
    const ids = db.prepare('SELECT id FROM learning_paths ORDER BY order_index,id').all() as unknown as Array<{ id: number }>;
    const unassignedMissions = db.prepare(`SELECT id,mission_number AS missionNumber,title,status
      FROM missions WHERE learning_path_stage_id IS NULL ORDER BY order_index,id`).all();
    res.json({ paths: ids.map(({ id }) => pathDetail(id)), unassignedMissions });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminLearningPathsRouter.post('/', (req, res) => {
  const name = String(req.body.name || '').trim(); const description = String(req.body.description || '').trim();
  if (!name || !description) return res.status(400).json({ error: 'Name and description are required' });
  if (!pathStatuses.has(req.body.status)) return res.status(400).json({ error: 'Invalid path status' });
  try {
    const order = (db.prepare('SELECT COALESCE(MAX(order_index),0)+1 AS value FROM learning_paths').get() as { value: number }).value;
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO learning_paths(name,slug,description,status,order_index,created_at,updated_at) VALUES(?,?,?,?,?,?,?)')
      .run(name, uniqueSlug(req.body.slug || name), description, req.body.status, order, now, now);
    res.status(201).json({ path: pathDetail(Number(result.lastInsertRowid)) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminLearningPathsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id); const name = String(req.body.name || '').trim(); const description = String(req.body.description || '').trim();
  if (!name || !description) return res.status(400).json({ error: 'Name and description are required' });
  if (!pathStatuses.has(req.body.status)) return res.status(400).json({ error: 'Invalid path status' });
  const result = db.prepare('UPDATE learning_paths SET name=?,slug=?,description=?,status=?,updated_at=? WHERE id=?')
    .run(name, uniqueSlug(req.body.slug || name, id), description, req.body.status, new Date().toISOString(), id);
  if (!result.changes) return res.status(404).json({ error: 'Learning path not found' });
  res.json({ path: pathDetail(id) });
});

adminLearningPathsRouter.patch('/:id/status', (req, res) => {
  if (!pathStatuses.has(req.body.status)) return res.status(400).json({ error: 'Invalid path status' });
  const result = db.prepare('UPDATE learning_paths SET status=?,updated_at=? WHERE id=?').run(req.body.status, new Date().toISOString(), Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Learning path not found' });
  res.json({ path: pathDetail(Number(req.params.id)) });
});

adminLearningPathsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM learning_paths WHERE id=?').get(id)) return res.status(404).json({ error: 'Learning path not found' });
  try {
    db.exec('BEGIN');
    db.prepare('UPDATE missions SET learning_path_id=NULL,learning_path_stage_id=NULL,path_order_index=NULL WHERE learning_path_id=?').run(id);
    db.prepare('UPDATE learning_path_stages SET prerequisite_stage_id=NULL WHERE learning_path_id=?').run(id);
    db.prepare('DELETE FROM learning_path_stages WHERE learning_path_id=?').run(id);
    db.prepare('DELETE FROM learning_paths WHERE id=?').run(id);
    db.exec('COMMIT'); res.json({ success: true });
  } catch (error: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: error.message }); }
});

adminLearningPathsRouter.post('/:id/stages', (req, res) => {
  const pathId = Number(req.params.id); const name = String(req.body.name || '').trim();
  if (!db.prepare('SELECT id FROM learning_paths WHERE id=?').get(pathId)) return res.status(404).json({ error: 'Learning path not found' });
  if (!name) return res.status(400).json({ error: 'Stage name is required' });
  const order = (db.prepare('SELECT COALESCE(MAX(order_index),0)+1 AS value FROM learning_path_stages WHERE learning_path_id=?').get(pathId) as { value: number }).value;
  const now = new Date().toISOString();
  const result = db.prepare(`INSERT INTO learning_path_stages(learning_path_id,name,description,icon,accent,order_index,prerequisite_stage_id,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(pathId, name, String(req.body.description || '').trim(), icons.has(req.body.icon) ? req.body.icon : 'Network', accents.has(req.body.accent) ? req.body.accent : '#22D3EE', order, null, now, now);
  res.status(201).json({ path: pathDetail(pathId), stageId: Number(result.lastInsertRowid) });
});

adminLearningPathsRouter.put('/:id/stages/:stageId', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId); const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Stage name is required' });
  const result = db.prepare(`UPDATE learning_path_stages SET name=?,description=?,icon=?,accent=?,updated_at=? WHERE id=? AND learning_path_id=?`)
    .run(name, String(req.body.description || '').trim(), icons.has(req.body.icon) ? req.body.icon : 'Network', accents.has(req.body.accent) ? req.body.accent : '#22D3EE', new Date().toISOString(), stageId, pathId);
  if (!result.changes) return res.status(404).json({ error: 'Stage not found' });
  syncStageMissionMetadata(pathId); res.json({ path: pathDetail(pathId) });
});

adminLearningPathsRouter.patch('/:id/stages/:stageId/prerequisite', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId);
  const prerequisiteId = req.body.prerequisiteStageId === null || req.body.prerequisiteStageId === '' ? null : Number(req.body.prerequisiteStageId);
  if (prerequisiteId === stageId) return res.status(400).json({ error: 'A stage cannot require itself' });
  if (prerequisiteId && !db.prepare('SELECT id FROM learning_path_stages WHERE id=? AND learning_path_id=?').get(prerequisiteId, pathId)) return res.status(400).json({ error: 'Prerequisite must belong to the same path' });
  const result = db.prepare('UPDATE learning_path_stages SET prerequisite_stage_id=?,updated_at=? WHERE id=? AND learning_path_id=?')
    .run(prerequisiteId, new Date().toISOString(), stageId, pathId);
  if (!result.changes) return res.status(404).json({ error: 'Stage not found' });
  res.json({ path: pathDetail(pathId) });
});

adminLearningPathsRouter.post('/:id/stages/:stageId/reorder', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId); const direction = req.body.direction;
  if (direction !== 'up' && direction !== 'down') return res.status(400).json({ error: 'Direction must be up or down' });
  const stage = db.prepare('SELECT id,order_index FROM learning_path_stages WHERE id=? AND learning_path_id=?').get(stageId, pathId) as { id: number; order_index: number } | undefined;
  if (!stage) return res.status(404).json({ error: 'Stage not found' });
  const neighbor = db.prepare(`SELECT id,order_index FROM learning_path_stages WHERE learning_path_id=? AND order_index ${direction === 'up' ? '<' : '>'} ? ORDER BY order_index ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`).get(pathId, stage.order_index) as { id: number; order_index: number } | undefined;
  if (!neighbor) return res.json({ changed: false, path: pathDetail(pathId) });
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE learning_path_stages SET order_index=? WHERE id=?').run(neighbor.order_index, stage.id);
    db.prepare('UPDATE learning_path_stages SET order_index=? WHERE id=?').run(stage.order_index, neighbor.id);
    syncStageMissionMetadata(pathId); db.exec('COMMIT'); res.json({ changed: true, path: pathDetail(pathId) });
  } catch (error: any) { db.exec('ROLLBACK'); res.status(500).json({ error: error.message }); }
});

adminLearningPathsRouter.delete('/:id/stages/:stageId', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId);
  try {
    db.exec('BEGIN');
    db.prepare('UPDATE missions SET learning_path_id=NULL,learning_path_stage_id=NULL,path_order_index=NULL WHERE learning_path_stage_id=?').run(stageId);
    db.prepare('UPDATE learning_path_stages SET prerequisite_stage_id=NULL WHERE prerequisite_stage_id=?').run(stageId);
    const result = db.prepare('DELETE FROM learning_path_stages WHERE id=? AND learning_path_id=?').run(stageId, pathId);
    if (!result.changes) { db.exec('ROLLBACK'); return res.status(404).json({ error: 'Stage not found' }); }
    db.exec('COMMIT'); res.json({ path: pathDetail(pathId) });
  } catch (error: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: error.message }); }
});

adminLearningPathsRouter.post('/:id/stages/:stageId/missions', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId); const missionId = Number(req.body.missionId);
  const stage = db.prepare('SELECT name,order_index FROM learning_path_stages WHERE id=? AND learning_path_id=?').get(stageId, pathId) as { name: string; order_index: number } | undefined;
  if (!stage) return res.status(404).json({ error: 'Stage not found' });
  if (!db.prepare('SELECT id FROM missions WHERE id=?').get(missionId)) return res.status(404).json({ error: 'Mission not found' });
  const order = (db.prepare('SELECT COALESCE(MAX(path_order_index),0)+1 AS value FROM missions WHERE learning_path_stage_id=?').get(stageId) as { value: number }).value;
  db.prepare('UPDATE missions SET learning_path_id=?,learning_path_stage_id=?,path_order_index=?,stage=?,stage_name=? WHERE id=?')
    .run(pathId, stageId, order, stage.order_index, stage.name, missionId);
  res.json({ path: pathDetail(pathId) });
});

adminLearningPathsRouter.delete('/:id/stages/:stageId/missions/:missionId', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId); const missionId = Number(req.params.missionId);
  const result = db.prepare('UPDATE missions SET learning_path_id=NULL,learning_path_stage_id=NULL,path_order_index=NULL WHERE id=? AND learning_path_id=? AND learning_path_stage_id=?').run(missionId, pathId, stageId);
  if (!result.changes) return res.status(404).json({ error: 'Assigned mission not found' });
  res.json({ path: pathDetail(pathId) });
});

adminLearningPathsRouter.post('/:id/stages/:stageId/missions/:missionId/reorder', (req, res) => {
  const pathId = Number(req.params.id); const stageId = Number(req.params.stageId); const missionId = Number(req.params.missionId); const direction = req.body.direction;
  if (direction !== 'up' && direction !== 'down') return res.status(400).json({ error: 'Direction must be up or down' });
  const mission = db.prepare('SELECT id,path_order_index FROM missions WHERE id=? AND learning_path_id=? AND learning_path_stage_id=?').get(missionId, pathId, stageId) as { id: number; path_order_index: number } | undefined;
  if (!mission) return res.status(404).json({ error: 'Assigned mission not found' });
  const neighbor = db.prepare(`SELECT id,path_order_index FROM missions WHERE learning_path_stage_id=? AND path_order_index ${direction === 'up' ? '<' : '>'} ? ORDER BY path_order_index ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`).get(stageId, mission.path_order_index) as { id: number; path_order_index: number } | undefined;
  if (!neighbor) return res.json({ changed: false, path: pathDetail(pathId) });
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE missions SET path_order_index=? WHERE id=?').run(neighbor.path_order_index, mission.id);
    db.prepare('UPDATE missions SET path_order_index=? WHERE id=?').run(mission.path_order_index, neighbor.id);
    db.exec('COMMIT'); res.json({ changed: true, path: pathDetail(pathId) });
  } catch (error: any) { db.exec('ROLLBACK'); res.status(500).json({ error: error.message }); }
});
