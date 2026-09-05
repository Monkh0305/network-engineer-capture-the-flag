import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { db } from './db.ts';

export const adminAnalyticsRouter = Router();

const categoryCase = `CASE
  WHEN mission.category IN ('Fundamental','Network Fundamentals') THEN 'Network Fundamentals'
  WHEN mission.category IN ('IP Addressing','Subnetting') THEN 'IP Addressing'
  WHEN mission.category IN ('Switching','Default Gateway') THEN 'Switching'
  WHEN mission.category='VLAN' THEN 'VLAN'
  WHEN mission.category='Routing' THEN 'Routing'
  WHEN mission.category IN ('Troubleshooting','Security') THEN 'Troubleshooting'
  ELSE mission.category END`;

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildAdminAnalytics(database: DatabaseSync = db) {
    const learningPerformance = database.prepare(`WITH ranked AS (
      SELECT result.user_id,result.assessment_type,result.score,
        ROW_NUMBER() OVER(PARTITION BY result.user_id,result.assessment_type ORDER BY result.completed_at DESC,result.id DESC) AS rank
      FROM assessment_results result JOIN users learner ON learner.id=result.user_id WHERE learner.role='user'
    ), latest AS (SELECT user_id,assessment_type,score FROM ranked WHERE rank=1), paired AS (
      SELECT user_id,MAX(CASE WHEN assessment_type='pretest' THEN score END) AS pre,
        MAX(CASE WHEN assessment_type='posttest' THEN score END) AS post FROM latest GROUP BY user_id
    ) SELECT ROUND(AVG(pre),1) AS averagePreTestScore,ROUND(AVG(post),1) AS averagePostTestScore,
      ROUND(AVG(CASE WHEN pre IS NOT NULL AND post IS NOT NULL THEN post-pre END),1) AS averageImprovement,
      COUNT(CASE WHEN pre IS NOT NULL OR post IS NOT NULL THEN 1 END) AS assessmentParticipants,
      COUNT(CASE WHEN pre IS NOT NULL AND post IS NOT NULL THEN 1 END) AS pairedParticipants FROM paired`).get() as any;

    const missionMetrics = database.prepare(`WITH attempts AS (
      SELECT progress.user_id,progress.mission_id,progress.status,progress.score FROM user_progress progress
      JOIN users learner ON learner.id=progress.user_id WHERE learner.role='user' AND progress.status IN ('in_progress','completed')
    ), completed_time AS (
      SELECT session.user_id,session.mission_id,SUM(session.active_seconds) AS seconds
      FROM user_learning_sessions session JOIN users learner ON learner.id=session.user_id AND learner.role='user'
      JOIN user_progress progress ON progress.user_id=session.user_id AND progress.mission_id=session.mission_id AND progress.status='completed'
      WHERE session.mission_id IS NOT NULL GROUP BY session.user_id,session.mission_id
    ), learning_by_user AS (
      SELECT session.user_id,SUM(session.active_seconds) AS seconds FROM user_learning_sessions session
      JOIN users learner ON learner.id=session.user_id AND learner.role='user' GROUP BY session.user_id
    ) SELECT
      COALESCE(ROUND(100.0*SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),1),0) AS missionCompletionRate,
      COALESCE(ROUND((SELECT AVG(seconds) FROM learning_by_user),1),0) AS averageActiveLearningSeconds,
      ROUND((SELECT AVG(seconds)/60.0 FROM completed_time),1) AS averageMissionCompletionMinutes,
      COALESCE(ROUND(100.0*(SELECT COUNT(*) FROM (
        SELECT DISTINCT used.user_id,hint.mission_id FROM user_hints used JOIN hints hint ON hint.id=used.hint_id
        JOIN users learner ON learner.id=used.user_id AND learner.role='user'
        JOIN attempts attempt ON attempt.user_id=used.user_id AND attempt.mission_id=hint.mission_id
      ))/NULLIF(COUNT(*),0),1),0) AS hintUsageRate
      FROM attempts`).get() as any;

    const activeUsers30Days = database.prepare(`WITH RECURSIVE days(day) AS (
      SELECT date('now','localtime','-29 days') UNION ALL SELECT date(day,'+1 day') FROM days WHERE day<date('now','localtime')
    ) SELECT days.day AS date,COUNT(DISTINCT CASE WHEN learner.role='user' THEN activity.user_id END) AS value
      FROM days LEFT JOIN activity_logs activity ON date(activity.created_at,'localtime')=days.day
      LEFT JOIN users learner ON learner.id=activity.user_id GROUP BY days.day ORDER BY days.day`).all();

    const activeLearningTime30Days = database.prepare(`WITH RECURSIVE days(day) AS (
      SELECT date('now','localtime','-29 days') UNION ALL SELECT date(day,'+1 day') FROM days WHERE day<date('now','localtime')
    ) SELECT days.day AS date,COALESCE(ROUND(SUM(CASE WHEN learner.role='user' THEN session.active_seconds ELSE 0 END)/60.0,1),0) AS value
      FROM days LEFT JOIN user_learning_sessions session ON date(session.started_at,'localtime')=days.day
      LEFT JOIN users learner ON learner.id=session.user_id GROUP BY days.day ORDER BY days.day`).all();

    const completionByCategory = database.prepare(`WITH categories(name,position) AS (VALUES
      ('Network Fundamentals',1),('IP Addressing',2),('Switching',3),('VLAN',4),('Routing',5),('Troubleshooting',6)
    ), stats AS (SELECT ${categoryCase} AS category,
      COUNT(CASE WHEN progress.status IN ('in_progress','completed') AND learner.role='user' THEN 1 END) AS attempts,
      COUNT(CASE WHEN progress.status='completed' AND learner.role='user' THEN 1 END) AS completed
      FROM missions mission LEFT JOIN user_progress progress ON progress.mission_id=mission.id
      LEFT JOIN users learner ON learner.id=progress.user_id WHERE mission.status='published' GROUP BY ${categoryCase})
    SELECT categories.name AS category,COALESCE(stats.attempts,0) AS attempts,COALESCE(stats.completed,0) AS completed,
      COALESCE(ROUND(100.0*stats.completed/NULLIF(stats.attempts,0),1),0) AS completionRate
      FROM categories LEFT JOIN stats ON stats.category=categories.name ORDER BY categories.position`).all();

    const missionRows = database.prepare(`WITH attempt_stats AS (
      SELECT mission.id AS mission_id,COUNT(CASE WHEN learner.id IS NOT NULL THEN progress.user_id END) AS attempts,
        COUNT(CASE WHEN progress.status='completed' AND learner.id IS NOT NULL THEN 1 END) AS completed,
        ROUND(AVG(CASE WHEN learner.id IS NOT NULL THEN progress.score END),1) AS average_score
      FROM missions mission LEFT JOIN user_progress progress ON progress.mission_id=mission.id AND progress.status IN ('in_progress','completed')
      LEFT JOIN users learner ON learner.id=progress.user_id AND learner.role='user'
      WHERE mission.status='published' GROUP BY mission.id
    ), hint_stats AS (
      SELECT hint.mission_id,COUNT(DISTINCT used.user_id) AS users FROM user_hints used JOIN hints hint ON hint.id=used.hint_id
      JOIN users learner ON learner.id=used.user_id AND learner.role='user' GROUP BY hint.mission_id
    ), time_stats AS (
      SELECT totals.mission_id,ROUND(AVG(totals.seconds)/60.0,1) AS average_minutes FROM (
        SELECT session.user_id,session.mission_id,SUM(session.active_seconds) AS seconds FROM user_learning_sessions session
        JOIN users learner ON learner.id=session.user_id AND learner.role='user'
        JOIN user_progress progress ON progress.user_id=session.user_id AND progress.mission_id=session.mission_id AND progress.status='completed'
        WHERE session.mission_id IS NOT NULL GROUP BY session.user_id,session.mission_id) totals GROUP BY totals.mission_id
    ), question_stats AS (
      SELECT question.mission_id,COUNT(activity.id) AS answers,
        COUNT(CASE WHEN json_extract(activity.metadata,'$.correct')=0 THEN 1 END) AS failed
      FROM activity_logs activity JOIN questions question ON activity.entity_type='question' AND question.id=activity.entity_id
      JOIN users learner ON learner.id=activity.user_id AND learner.role='user' GROUP BY question.mission_id
    ) SELECT mission.id AS missionId,mission.title,${categoryCase} AS category,
      COALESCE(attempt_stats.attempts,0) AS attempts,
      COALESCE(attempt_stats.completed,0) AS completed,
      COALESCE(ROUND(100.0*attempt_stats.completed/NULLIF(attempt_stats.attempts,0),1),0) AS completionRate,
      time_stats.average_minutes AS averageTimeMinutes,
      COALESCE(ROUND(100.0*hint_stats.users/NULLIF(attempt_stats.attempts,0),1),0) AS hintUsageRate,
      COALESCE(attempt_stats.average_score,0) AS averageScore,
      COALESCE(ROUND(100.0*question_stats.failed/NULLIF(question_stats.answers,0),1),0) AS questionFailureRate
      FROM missions mission LEFT JOIN attempt_stats ON attempt_stats.mission_id=mission.id
      LEFT JOIN hint_stats ON hint_stats.mission_id=mission.id LEFT JOIN time_stats ON time_stats.mission_id=mission.id
      LEFT JOIN question_stats ON question_stats.mission_id=mission.id WHERE mission.status='published' ORDER BY mission.order_index`).all() as any[];

    const missionPerformance = missionRows.map((mission) => {
      const difficultyScore = Math.round(((100 - finiteNumber(mission.completionRate)) * 0.6 + finiteNumber(mission.hintUsageRate) * 0.25 + finiteNumber(mission.questionFailureRate) * 0.15) * 10) / 10;
      return { ...mission, attempts: finiteNumber(mission.attempts), completed: finiteNumber(mission.completed), completionRate: finiteNumber(mission.completionRate), hintUsageRate: finiteNumber(mission.hintUsageRate), averageScore: finiteNumber(mission.averageScore), questionFailureRate: finiteNumber(mission.questionFailureRate), averageTimeMinutes: mission.averageTimeMinutes === null ? null : finiteNumber(mission.averageTimeMinutes), difficultyScore };
    });

    const failedQuestions = database.prepare(`SELECT question.id,question.question,mission.title AS mission,
      COUNT(activity.id) AS attempts,COUNT(CASE WHEN json_extract(activity.metadata,'$.correct')=0 THEN 1 END) AS failures,
      COALESCE(ROUND(100.0*COUNT(CASE WHEN json_extract(activity.metadata,'$.correct')=0 THEN 1 END)/NULLIF(COUNT(activity.id),0),1),0) AS failureRate
      FROM activity_logs activity JOIN questions question ON activity.entity_type='question' AND question.id=activity.entity_id
      JOIN missions mission ON mission.id=question.mission_id JOIN users learner ON learner.id=activity.user_id AND learner.role='user'
      GROUP BY question.id ORDER BY failures DESC,failureRate DESC,question.id LIMIT 8`).all();

    const totalPublished = (database.prepare("SELECT COUNT(*) AS count FROM missions WHERE status='published'").get() as { count: number }).count;
    const progressDistribution = database.prepare(`WITH learner_progress AS (
      SELECT learner.id,COUNT(CASE WHEN progress.status='completed' THEN 1 END) AS completed
      FROM users learner LEFT JOIN user_progress progress ON progress.user_id=learner.id WHERE learner.role='user' GROUP BY learner.id
    ), values_with_percent AS (SELECT id,CASE WHEN ?=0 THEN 0 ELSE 100.0*completed/? END AS percentage FROM learner_progress), buckets(label,minimum,maximum,position) AS (
      VALUES ('0%',0,0,1),('1–25%',0.0001,25,2),('26–50%',25.0001,50,3),('51–75%',50.0001,75,4),('76–99%',75.0001,99.9999,5),('100%',100,100,6)
    ) SELECT buckets.label,COUNT(values_with_percent.id) AS value FROM buckets LEFT JOIN values_with_percent ON values_with_percent.percentage BETWEEN buckets.minimum AND buckets.maximum GROUP BY buckets.label,buckets.position ORDER BY buckets.position`).all(totalPublished, totalPublished);

    return {
      generatedAt: new Date().toISOString(), periodDays: 30,
      metrics: {
        averagePreTestScore: learningPerformance.averagePreTestScore,
        averagePostTestScore: learningPerformance.averagePostTestScore,
        averageImprovement: learningPerformance.averageImprovement,
        missionCompletionRate: finiteNumber(missionMetrics.missionCompletionRate),
        averageActiveLearningSeconds: finiteNumber(missionMetrics.averageActiveLearningSeconds),
        averageMissionCompletionMinutes: missionMetrics.averageMissionCompletionMinutes === null ? null : finiteNumber(missionMetrics.averageMissionCompletionMinutes),
        hintUsageRate: finiteNumber(missionMetrics.hintUsageRate),
        assessmentParticipants: finiteNumber(learningPerformance.assessmentParticipants),
        pairedParticipants: finiteNumber(learningPerformance.pairedParticipants),
      },
      activeUsers30Days, activeLearningTime30Days, completionByCategory,
      assessmentComparison: [
        { label: 'Pre-Test', value: learningPerformance.averagePreTestScore },
        { label: 'Post-Test', value: learningPerformance.averagePostTestScore },
      ],
      hintUsageByMission: missionPerformance.map(({ missionId, title, hintUsageRate }) => ({ missionId, label: title, value: hintUsageRate })),
      progressDistribution,
      missionPerformance,
      mostDifficultMissions: [...missionPerformance].filter((mission) => mission.attempts > 0).sort((a, b) => b.difficultyScore - a.difficultyScore).slice(0, 5),
      failedQuestions,
      definitions: {
        missionCompletionRate: 'Completed learner-mission records divided by learner-mission records that reached in-progress or completed state.',
        attempts: 'Unique learner-mission progress records that reached in-progress or completed state; retries are not stored separately.',
        difficultyScore: '60% completion gap + 25% hint usage rate + 15% question failure rate.',
        averageImprovement: 'Average of latest Post-Test minus latest Pre-Test percentage points, only for learners with both results.',
      },
    };
}

adminAnalyticsRouter.get('/', (_req, res) => {
  try {
    res.json(buildAdminAnalytics());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
