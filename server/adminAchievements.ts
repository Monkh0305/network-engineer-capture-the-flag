import { Router } from 'express';
import { db } from './db.ts';

export const adminAchievementsRouter = Router();
export const achievementConditionTypes = new Set([
  'mission_count', 'category_routing', 'category_vlan', 'category_ip_addressing',
  'no_hint_completion', 'perfect_score_count', 'packet_tracer_download_count', 'xp_total',
]);

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'achievement';
}

function uniqueSlug(value: string, excludeId?: number): string {
  const base = slugify(value); let candidate = base; let suffix = 2;
  while (db.prepare(`SELECT id FROM achievements WHERE slug=? ${excludeId ? 'AND id != ?' : ''}`).get(...(excludeId ? [candidate, excludeId] : [candidate]))) candidate = `${base}_${suffix++}`;
  return candidate;
}

function validate(body: any): string | null {
  if (!String(body.name || '').trim()) return 'Name is required';
  if (!String(body.description || '').trim()) return 'Description is required';
  if (!/^[A-Za-z][A-Za-z0-9]{1,39}$/.test(String(body.icon || ''))) return 'Icon must be a supported icon name';
  if (!achievementConditionTypes.has(body.conditionType)) return 'Invalid condition type';
  if (!Number.isInteger(Number(body.conditionValue)) || Number(body.conditionValue) <= 0) return 'Condition value must be a positive integer';
  return null;
}

function achievement(id: number) {
  return db.prepare(`SELECT a.id,a.slug,a.name,a.description,a.icon,a.category,
    a.condition_type AS conditionType,a.condition_value AS conditionValue,a.is_active AS isActive,
    a.created_at AS createdAt,a.updated_at AS updatedAt,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.achievement_id=a.id) AS unlockedCount
    FROM achievements a WHERE a.id=?`).get(id);
}

adminAchievementsRouter.get('/', (_req, res) => {
  try {
    const achievements = db.prepare(`SELECT a.id,a.slug,a.name,a.description,a.icon,a.category,
      a.condition_type AS conditionType,a.condition_value AS conditionValue,a.is_active AS isActive,
      a.created_at AS createdAt,a.updated_at AS updatedAt,
      (SELECT COUNT(*) FROM user_achievements ua WHERE ua.achievement_id=a.id) AS unlockedCount
      FROM achievements a ORDER BY a.id`).all();
    res.json({ achievements, conditionTypes: [...achievementConditionTypes] });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminAchievementsRouter.post('/', (req, res) => {
  const error = validate(req.body); if (error) return res.status(400).json({ error });
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`INSERT INTO achievements(slug,name,description,icon,category,condition_type,condition_value,is_active,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run(uniqueSlug(req.body.name), String(req.body.name).trim(), String(req.body.description).trim(), req.body.icon,
      'Custom', req.body.conditionType, Number(req.body.conditionValue), req.body.isActive === false ? 0 : 1, now, now);
    res.status(201).json({ achievement: achievement(Number(result.lastInsertRowid)) });
  } catch (cause: any) { res.status(500).json({ error: cause.message }); }
});

adminAchievementsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id); const error = validate(req.body); if (error) return res.status(400).json({ error });
  const result = db.prepare(`UPDATE achievements SET name=?,slug=?,description=?,icon=?,condition_type=?,condition_value=?,is_active=?,updated_at=? WHERE id=?`)
    .run(String(req.body.name).trim(), uniqueSlug(req.body.name, id), String(req.body.description).trim(), req.body.icon,
      req.body.conditionType, Number(req.body.conditionValue), req.body.isActive === false ? 0 : 1, new Date().toISOString(), id);
  if (!result.changes) return res.status(404).json({ error: 'Achievement not found' });
  res.json({ achievement: achievement(id) });
});

adminAchievementsRouter.patch('/:id/active', (req, res) => {
  if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be boolean' });
  const id = Number(req.params.id);
  const result = db.prepare('UPDATE achievements SET is_active=?,updated_at=? WHERE id=?').run(req.body.isActive ? 1 : 0, new Date().toISOString(), id);
  if (!result.changes) return res.status(404).json({ error: 'Achievement not found' });
  res.json({ achievement: achievement(id) });
});

adminAchievementsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const unlocks = (db.prepare('SELECT COUNT(*) AS count FROM user_achievements WHERE achievement_id=?').get(id) as { count: number }).count;
  if (unlocks > 0) return res.status(409).json({ error: 'Achievement has already been unlocked by users. Disable it instead.' });
  const result = db.prepare('DELETE FROM achievements WHERE id=?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Achievement not found' });
  res.json({ success: true });
});
