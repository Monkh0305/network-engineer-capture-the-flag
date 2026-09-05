import { Router } from 'express';
import { db } from './db.ts';

export const adminAssessmentsRouter = Router();
const assessmentTypes = new Set(['pretest', 'posttest']);
const categories = new Set(['IP Addressing', 'Subnetting', 'VLAN', 'Routing', 'Troubleshooting']);
const answers = new Set(['A', 'B', 'C', 'D']);

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'assessment';
}
function uniqueSlug(value: string, excludeId?: number): string {
  const base = slugify(value); let candidate = base; let suffix = 2;
  while (db.prepare(`SELECT id FROM assessments WHERE slug=? ${excludeId ? 'AND id!=?' : ''}`).get(...(excludeId ? [candidate, excludeId] : [candidate]))) candidate = `${base}-${suffix++}`;
  return candidate;
}
function validateAssessment(body: any): string | null {
  if (!String(body.title || '').trim()) return 'Title is required';
  if (!String(body.description || '').trim()) return 'Description is required';
  if (!assessmentTypes.has(body.assessmentType)) return 'Invalid assessment type';
  return null;
}
function validateQuestion(body: any): string | null {
  if (!categories.has(body.category)) return 'Invalid question category';
  if (!String(body.question || '').trim()) return 'Question is required';
  if (['optionA', 'optionB', 'optionC', 'optionD'].some((field) => !String(body[field] || '').trim())) return 'All four options are required';
  if (!answers.has(String(body.correctAnswer || '').toUpperCase())) return 'Correct answer must be A, B, C, or D';
  if (!String(body.explanation || '').trim()) return 'Explanation is required';
  return null;
}
function assessmentRow(id: number) {
  return db.prepare(`SELECT a.id,a.title,a.slug,a.assessment_type AS assessmentType,a.description,a.is_active AS isActive,
    a.created_at AS createdAt,a.updated_at AS updatedAt,
    (SELECT COUNT(*) FROM assessment_question_assignments map WHERE map.assessment_id=a.id) AS questionCount,
    (SELECT COUNT(*) FROM assessment_results result WHERE result.assessment_id=a.id OR (result.assessment_id IS NULL AND result.assessment_type=a.assessment_type)) AS resultCount
    FROM assessments a WHERE a.id=?`).get(id);
}
function setActive(id: number, isActive: boolean) {
  const item = db.prepare('SELECT assessment_type FROM assessments WHERE id=?').get(id) as { assessment_type: string } | undefined;
  if (!item) return false;
  db.exec('BEGIN');
  try {
    if (isActive) db.prepare('UPDATE assessments SET is_active=0 WHERE assessment_type=?').run(item.assessment_type);
    db.prepare('UPDATE assessments SET is_active=?,updated_at=? WHERE id=?').run(isActive ? 1 : 0, new Date().toISOString(), id);
    db.exec('COMMIT'); return true;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

adminAssessmentsRouter.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT id FROM assessments ORDER BY assessment_type,created_at,id').all() as unknown as Array<{ id: number }>;
    res.json({ assessments: rows.map(({ id }) => assessmentRow(id)), categories: [...categories] });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminAssessmentsRouter.post('/', (req, res) => {
  const error = validateAssessment(req.body); if (error) return res.status(400).json({ error });
  try {
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO assessments(title,slug,assessment_type,description,is_active,created_at,updated_at) VALUES(?,?,?,?,0,?,?)')
      .run(String(req.body.title).trim(), uniqueSlug(req.body.slug || req.body.title), req.body.assessmentType, String(req.body.description).trim(), now, now);
    const id = Number(result.lastInsertRowid);
    if (req.body.isActive === true) setActive(id, true);
    res.status(201).json({ assessment: assessmentRow(id) });
  } catch (cause: any) { res.status(500).json({ error: cause.message }); }
});

adminAssessmentsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id); const error = validateAssessment(req.body); if (error) return res.status(400).json({ error });
  const existing = db.prepare('SELECT id FROM assessments WHERE id=?').get(id); if (!existing) return res.status(404).json({ error: 'Assessment not found' });
  try {
    db.prepare('UPDATE assessments SET title=?,slug=?,assessment_type=?,description=?,updated_at=? WHERE id=?')
      .run(String(req.body.title).trim(), uniqueSlug(req.body.slug || req.body.title, id), req.body.assessmentType, String(req.body.description).trim(), new Date().toISOString(), id);
    setActive(id, req.body.isActive === true);
    res.json({ assessment: assessmentRow(id) });
  } catch (cause: any) { res.status(500).json({ error: cause.message }); }
});

adminAssessmentsRouter.patch('/:id/active', (req, res) => {
  if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be boolean' });
  try {
    if (!setActive(Number(req.params.id), req.body.isActive)) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ assessment: assessmentRow(Number(req.params.id)) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminAssessmentsRouter.get('/results/aggregate', (_req, res) => {
  try {
    const metrics = db.prepare(`WITH ranked AS (
      SELECT user_id,assessment_type,score,ROW_NUMBER() OVER(PARTITION BY user_id,assessment_type ORDER BY completed_at DESC,id DESC) AS rank
      FROM assessment_results
    ), latest AS (SELECT user_id,assessment_type,score FROM ranked WHERE rank=1), paired AS (
      SELECT user_id,MAX(CASE WHEN assessment_type='pretest' THEN score END) AS pre,
        MAX(CASE WHEN assessment_type='posttest' THEN score END) AS post FROM latest GROUP BY user_id
    ) SELECT ROUND(AVG(pre),1) AS averagePreTest,ROUND(AVG(post),1) AS averagePostTest,
      ROUND(AVG(CASE WHEN pre IS NOT NULL AND post IS NOT NULL THEN post-pre END),1) AS averageImprovement,
      COUNT(*) AS numberOfParticipants,COUNT(CASE WHEN pre IS NOT NULL AND post IS NOT NULL THEN 1 END) AS pairedParticipants FROM paired`).get();
    res.json({ metrics });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminAssessmentsRouter.get('/results', (req, res) => {
  try {
    const type = assessmentTypes.has(String(req.query.type)) ? String(req.query.type) : 'all';
    const assessmentId = Number(req.query.assessmentId) || null;
    const conditions: string[] = []; const params: Array<string | number> = [];
    if (type !== 'all') { conditions.push('result.assessment_type=?'); params.push(type); }
    if (assessmentId) { conditions.push('result.assessment_id=?'); params.push(assessmentId); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const results = db.prepare(`SELECT result.id,user.username,result.assessment_type AS assessmentType,
      COALESCE(assessment.title,CASE result.assessment_type WHEN 'pretest' THEN 'Pre-Test' ELSE 'Post-Test' END) AS assessmentTitle,
      result.score AS percentage,result.total_questions AS totalQuestions,
      COALESCE(result.correct_answers,ROUND(result.score*result.total_questions/100.0)) AS correctAnswers,
      result.completed_at AS completedAt FROM assessment_results result JOIN users user ON user.id=result.user_id
      LEFT JOIN assessments assessment ON assessment.id=result.assessment_id ${where}
      ORDER BY result.completed_at DESC,result.id DESC`).all(...params);
    res.json({ results });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminAssessmentsRouter.get('/:id/questions', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!assessmentRow(id)) return res.status(404).json({ error: 'Assessment not found' });
    const questions = db.prepare(`SELECT question.id,question.category,question.question,
      question.option_a AS optionA,question.option_b AS optionB,question.option_c AS optionC,question.option_d AS optionD,
      question.correct_answer AS correctAnswer,question.explanation,map.order_index AS orderIndex
      FROM assessment_question_assignments map JOIN assessment_questions question ON question.id=map.question_id
      WHERE map.assessment_id=? ORDER BY map.order_index,question.id`).all(id);
    res.json({ assessment: assessmentRow(id), questions });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

adminAssessmentsRouter.post('/:id/questions', (req, res) => {
  const assessmentId = Number(req.params.id); const error = validateQuestion(req.body); if (error) return res.status(400).json({ error });
  if (!assessmentRow(assessmentId)) return res.status(404).json({ error: 'Assessment not found' });
  try {
    db.exec('BEGIN');
    const result = db.prepare(`INSERT INTO assessment_questions(category,question,option_a,option_b,option_c,option_d,correct_answer,explanation)
      VALUES(?,?,?,?,?,?,?,?)`).run(req.body.category, String(req.body.question).trim(), String(req.body.optionA).trim(), String(req.body.optionB).trim(), String(req.body.optionC).trim(), String(req.body.optionD).trim(), String(req.body.correctAnswer).toUpperCase(), String(req.body.explanation).trim());
    const order = (db.prepare('SELECT COALESCE(MAX(order_index),0)+1 AS value FROM assessment_question_assignments WHERE assessment_id=?').get(assessmentId) as { value: number }).value;
    db.prepare('INSERT INTO assessment_question_assignments(assessment_id,question_id,order_index) VALUES(?,?,?)').run(assessmentId, Number(result.lastInsertRowid), order);
    db.exec('COMMIT'); res.status(201).json({ questionId: Number(result.lastInsertRowid) });
  } catch (cause: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: cause.message }); }
});

adminAssessmentsRouter.put('/:id/questions/:questionId', (req, res) => {
  const assessmentId = Number(req.params.id); let questionId = Number(req.params.questionId); const error = validateQuestion(req.body); if (error) return res.status(400).json({ error });
  const map = db.prepare('SELECT order_index FROM assessment_question_assignments WHERE assessment_id=? AND question_id=?').get(assessmentId, questionId) as { order_index: number } | undefined;
  if (!map) return res.status(404).json({ error: 'Question not found in this assessment' });
  try {
    const assignmentCount = (db.prepare('SELECT COUNT(*) AS count FROM assessment_question_assignments WHERE question_id=?').get(questionId) as { count: number }).count;
    db.exec('BEGIN');
    if (assignmentCount > 1) {
      const cloned = db.prepare(`INSERT INTO assessment_questions(category,question,option_a,option_b,option_c,option_d,correct_answer,explanation)
        VALUES(?,?,?,?,?,?,?,?)`).run(req.body.category, String(req.body.question).trim(), String(req.body.optionA).trim(), String(req.body.optionB).trim(), String(req.body.optionC).trim(), String(req.body.optionD).trim(), String(req.body.correctAnswer).toUpperCase(), String(req.body.explanation).trim());
      const newId = Number(cloned.lastInsertRowid);
      db.prepare('DELETE FROM assessment_question_assignments WHERE assessment_id=? AND question_id=?').run(assessmentId, questionId);
      db.prepare('INSERT INTO assessment_question_assignments(assessment_id,question_id,order_index) VALUES(?,?,?)').run(assessmentId, newId, map.order_index);
      questionId = newId;
    } else {
      db.prepare(`UPDATE assessment_questions SET category=?,question=?,option_a=?,option_b=?,option_c=?,option_d=?,correct_answer=?,explanation=? WHERE id=?`)
        .run(req.body.category, String(req.body.question).trim(), String(req.body.optionA).trim(), String(req.body.optionB).trim(), String(req.body.optionC).trim(), String(req.body.optionD).trim(), String(req.body.correctAnswer).toUpperCase(), String(req.body.explanation).trim(), questionId);
    }
    db.exec('COMMIT'); res.json({ success: true, questionId });
  } catch (cause: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: cause.message }); }
});

adminAssessmentsRouter.delete('/:id/questions/:questionId', (req, res) => {
  const assessmentId = Number(req.params.id); const questionId = Number(req.params.questionId);
  try {
    db.exec('BEGIN');
    const result = db.prepare('DELETE FROM assessment_question_assignments WHERE assessment_id=? AND question_id=?').run(assessmentId, questionId);
    if (!result.changes) { db.exec('ROLLBACK'); return res.status(404).json({ error: 'Question not found in this assessment' }); }
    const remaining = (db.prepare('SELECT COUNT(*) AS count FROM assessment_question_assignments WHERE question_id=?').get(questionId) as { count: number }).count;
    if (remaining === 0) db.prepare('DELETE FROM assessment_questions WHERE id=?').run(questionId);
    db.exec('COMMIT'); res.json({ success: true });
  } catch (error: any) { try { db.exec('ROLLBACK'); } catch {} res.status(500).json({ error: error.message }); }
});

adminAssessmentsRouter.post('/:id/questions/:questionId/reorder', (req, res) => {
  const assessmentId = Number(req.params.id); const questionId = Number(req.params.questionId); const direction = req.body.direction;
  if (direction !== 'up' && direction !== 'down') return res.status(400).json({ error: 'Direction must be up or down' });
  const current = db.prepare('SELECT question_id,order_index FROM assessment_question_assignments WHERE assessment_id=? AND question_id=?').get(assessmentId, questionId) as { question_id: number; order_index: number } | undefined;
  if (!current) return res.status(404).json({ error: 'Question not found' });
  const neighbor = db.prepare(`SELECT question_id,order_index FROM assessment_question_assignments WHERE assessment_id=? AND order_index ${direction === 'up' ? '<' : '>'} ? ORDER BY order_index ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`).get(assessmentId, current.order_index) as { question_id: number; order_index: number } | undefined;
  if (!neighbor) return res.json({ changed: false });
  db.exec('BEGIN'); try {
    db.prepare('UPDATE assessment_question_assignments SET order_index=? WHERE assessment_id=? AND question_id=?').run(neighbor.order_index, assessmentId, current.question_id);
    db.prepare('UPDATE assessment_question_assignments SET order_index=? WHERE assessment_id=? AND question_id=?').run(current.order_index, assessmentId, neighbor.question_id);
    db.exec('COMMIT'); res.json({ changed: true });
  } catch (error: any) { db.exec('ROLLBACK'); res.status(500).json({ error: error.message }); }
});
