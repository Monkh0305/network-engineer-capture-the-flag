export interface User {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  role: 'user' | 'admin';
  is_active: number;
  last_activity: string | null;
  created_at: string;
}

export interface AdminDashboardData {
  generatedAt: string;
  kpis: {
    totalUsers: number;
    onlineUsers: number;
    activeUsersToday: number;
    totalActiveLearningSeconds: number;
    totalMissionCompletions: number;
    totalFlagsCaptured: number;
  };
  dataAvailability: {
    activeLearningTime: boolean;
    missionAverageTime: boolean;
  };
  activityTrend: Array<{
    date: string;
    activeUsers: number;
    events: number;
  }>;
  learningPerformance: {
    averagePreTestScore: number | null;
    averagePostTestScore: number | null;
    averageImprovement: number | null;
  };
  missionPerformance: Array<{
    missionId: number;
    mission: string;
    completionRate: number;
    averageTimeMinutes: number | null;
    hintUsage: number;
  }>;
  recentActivity: Array<{
    id: string;
    eventType: 'LOGIN' | 'LOGOUT' | 'MISSION_STARTED' | 'MISSION_COMPLETED' | 'QUESTION_ANSWERED' | 'FLAG_CAPTURED' | 'HINT_USED' | 'PRETEST_COMPLETED' | 'POSTTEST_COMPLETED' | 'PACKET_TRACER_DOWNLOADED' | 'ACCOUNT_ENABLED' | 'ACCOUNT_DISABLED' | 'ROLE_CHANGED' | 'XP_ADJUSTED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_COMPLETED' | 'PROGRESS_RESET';
    username: string;
    mission: string | null;
    assessmentType: string | null;
    createdAt: string;
  }>;
}

export interface AdminUserListItem {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  level: number;
  xp: number;
  completedMissions: number;
  learningTime: number;
  lastActive: string | null;
  isActive: number;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AdminUserDetailData {
  user: User & {
    flagsCaptured: number;
    completedMissions: number;
    totalLearningTime: number;
    learningTimeThisWeek: number;
    averageSessionTime: number;
  };
  assessment: { preTest: number | null; postTest: number | null; improvement: number | null };
  categoryProgress: Array<{ category: string; total: number; completed: number }>;
  missionHistory: Array<{
    missionId: number; title: string; category: string; status: MissionStatus;
    score: number; xpEarned: number; completedAt: string | null;
  }>;
  flagHistory: Array<{ missionId: number; title: string; capturedAt: string; xpEarned: number }>;
  hintUsage: Array<{
    hintId: number; hintOrder: number; xpPenalty: number; missionId: number; mission: string; usedAt: string;
  }>;
  recentActivity: Array<{
    id: number; eventType: string; entityType: string | null; entityId: number | null;
    metadata: Record<string, string | number | boolean | null> | null; createdAt: string;
  }>;
}

export type AdminMissionStatus = 'draft' | 'published' | 'archived';
export type AdminMissionDifficulty = 'easy' | 'medium' | 'hard';
export type AdminMissionTaskType = 'scenario' | 'diagram' | 'lab' | 'investigation' | 'questions' | 'flag';

export interface AdminMission {
  id: number;
  missionNumber: number;
  title: string;
  slug: string;
  description: string;
  scenario: string;
  category: string;
  difficulty: AdminMissionDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  flag: string;
  status: AdminMissionStatus;
  orderIndex: number;
  learningPathId: number | null;
  packetTracerFile: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface AdminMissionTask {
  id: number;
  missionId: number;
  taskType: AdminMissionTaskType;
  title: string;
  content: string;
  orderIndex: number;
  isEnabled: number;
}

export interface AdminMissionsResponse {
  missions: AdminMission[];
  filters: { categories: string[] };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AdminPacketTracerLab {
  id: number | null;
  missionId: number;
  missionNumber: number;
  missionTitle: string;
  missionStatus: AdminMissionStatus;
  filename: string | null;
  legacyFilename: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
  updatedAt: string | null;
  isManaged: boolean;
}

export interface AdminPacketTracerLabsResponse {
  labs: AdminPacketTracerLab[];
  maxFileSize: number;
  allowedExtensions: string[];
}

export interface AdminLearningPathMission {
  id: number;
  missionNumber: number;
  title: string;
  status: AdminMissionStatus;
  stageId: number;
  pathOrderIndex: number;
}

export interface AdminLearningPathStage {
  id: number;
  learningPathId: number;
  name: string;
  description: string;
  icon: 'Network' | 'Terminal' | 'Route' | 'AlertTriangle';
  accent: string;
  orderIndex: number;
  prerequisiteStageId: number | null;
  missions: AdminLearningPathMission[];
}

export interface AdminLearningPath {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  stages: AdminLearningPathStage[];
}

export interface AdminLearningPathsResponse {
  paths: AdminLearningPath[];
  unassignedMissions: Array<{ id: number; missionNumber: number; title: string; status: AdminMissionStatus }>;
}

export interface UserLearningPathStage extends Omit<AdminLearningPathStage, 'learningPathId' | 'missions'> {
  prerequisiteMet: boolean;
  missions: Mission[];
}

export interface UserLearningPath {
  id: number;
  name: string;
  slug: string;
  description: string;
  orderIndex: number;
  stages: UserLearningPathStage[];
}

export interface AdminAchievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  conditionType: string;
  conditionValue: number;
  isActive: number;
  unlockedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssessment {
  id: number;
  title: string;
  slug: string;
  assessmentType: 'pretest' | 'posttest';
  description: string;
  isActive: number;
  questionCount: number;
  resultCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssessmentQuestion {
  id: number;
  category: 'IP Addressing' | 'Subnetting' | 'VLAN' | 'Routing' | 'Troubleshooting';
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  orderIndex: number;
}

export interface AdminAssessmentResult {
  id: number;
  username: string;
  assessmentType: 'pretest' | 'posttest';
  assessmentTitle: string;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

export interface AdminAssessmentMetrics {
  averagePreTest: number | null;
  averagePostTest: number | null;
  averageImprovement: number | null;
  numberOfParticipants: number;
  pairedParticipants: number;
}

export interface AdminAnalyticsPoint {
  date?: string;
  label?: string;
  value: number;
}

export interface AdminMissionPerformance {
  missionId: number;
  title: string;
  category: string;
  attempts: number;
  completed: number;
  completionRate: number;
  averageTimeMinutes: number | null;
  hintUsageRate: number;
  averageScore: number;
  questionFailureRate: number;
  difficultyScore: number;
}

export interface AdminAnalyticsData {
  generatedAt: string;
  periodDays: number;
  metrics: {
    averagePreTestScore: number | null;
    averagePostTestScore: number | null;
    averageImprovement: number | null;
    missionCompletionRate: number;
    averageActiveLearningSeconds: number;
    averageMissionCompletionMinutes: number | null;
    hintUsageRate: number;
    assessmentParticipants: number;
    pairedParticipants: number;
  };
  activeUsers30Days: Array<{ date: string; value: number }>;
  activeLearningTime30Days: Array<{ date: string; value: number }>;
  completionByCategory: Array<{ category: string; attempts: number; completed: number; completionRate: number }>;
  assessmentComparison: Array<{ label: string; value: number | null }>;
  hintUsageByMission: Array<{ missionId: number; label: string; value: number }>;
  progressDistribution: Array<{ label: string; value: number }>;
  missionPerformance: AdminMissionPerformance[];
  mostDifficultMissions: AdminMissionPerformance[];
  failedQuestions: Array<{ id: number; question: string; mission: string; attempts: number; failures: number; failureRate: number }>;
  definitions: Record<string, string>;
}

export interface AdminReportFilters {
  from: string | null;
  to: string | null;
  userId: number | null;
  missionId: number | null;
  category: string | null;
}

export interface AdminReportsData {
  filters: AdminReportFilters;
  summary: { learners: number; missionCompletionRate: number; assessmentSubmissions: number; activeLearningSeconds: number; hintsUsed: number };
  userProgress: Array<{ userId: number; username: string; missionsTouched: number; missionsStarted: number; missionsCompleted: number; completionRate: number }>;
  missionPerformance: Array<{ missionId: number; title: string; category: string; learners: number; started: number; completed: number; completionRate: number }>;
  assessmentPerformance: Array<{ assessmentType: 'pretest' | 'posttest'; submissions: number; participants: number; averageScore: number; minimumScore: number; maximumScore: number }>;
  activeLearningTime: Array<{ userId: number; username: string; activeSeconds: number; sessions: number; averageSessionSeconds: number }>;
  hintUsage: Array<{ missionId: number; title: string; category: string; hintsUsed: number; learners: number }>;
  definitions: Record<string, string>;
}

export interface AdminReportOptions {
  users: Array<{ id: number; username: string }>;
  missions: Array<{ id: number; title: string; category: string }>;
  categories: string[];
  eventTypes: string[];
}

export interface AdminActivityLog {
  id: number;
  time: string;
  userId: number | null;
  username: string | null;
  eventType: string;
  entityType: string | null;
  entityId: number | null;
  entity: string | null;
  details: Record<string, string | number | boolean> | null;
}

export interface AdminActivityResponse {
  logs: AdminActivityLog[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export type MissionDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MissionCategory = 'Network Fundamentals' | 'Fundamental' | 'IP Addressing' | 'Subnetting' | 'Switching' | 'VLAN' | 'Default Gateway' | 'Routing' | 'Troubleshooting' | 'Security';
export type MissionStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';

export interface TopologyNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'pc' | 'server' | 'cloud';
  ip: string;
  status: 'online' | 'error' | 'warning' | 'unknown';
  x: number;
  y: number;
  issue?: string;
}

export interface TopologyLink {
  from: string;
  to: string;
  status: 'normal' | 'down' | 'warning';
  label?: string;
}

export interface NetworkTopologyData {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface Mission {
  id: number;
  mission_number?: number;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  xp_reward: number;
  category: MissionCategory;
  stage: number;
  stage_name: string;
  estimated_time: string;
  packet_tracer_file: string;
  lab_file_size?: number | null;
  lab_uploaded_at?: string | null;
  order_index: number;
  incident_id: string;
  department: string;
  reported_time: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scenario_text: string;
  target_flag?: string;
  topology_json: string;
  checklists_json: string;
  topology?: NetworkTopologyData;
  checklists?: string[];
  status: MissionStatus;
  score: number;
  xp_earned: number;
  completionPercentage: number;
  completed_at?: string | null;
  totalQuestions?: number;
  answeredCount?: number;
}

export interface MissionTask {
  id: number;
  mission_id: number;
  task_type: 'scenario' | 'diagram' | 'lab' | 'investigation' | 'questions' | 'flag';
  title: string;
  content: string;
  order_index: number;
  is_enabled?: number;
}

export interface Question {
  id: number;
  mission_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: string;
  root_cause?: string | null;
  explanation?: string | null;
  selected_answer?: string | null;
  is_correct?: number | null;
}

export interface Hint {
  id: number;
  hint_order: number;
  xp_penalty: number;
  hint_text: string | null;
  is_unlocked: number;
}

export interface Achievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition_type?: string;
  condition_value?: number;
  is_active?: number;
  is_unlocked: number;
  unlocked_at?: string | null;
}

export interface LeaderboardUser {
  rank: number;
  id: number;
  username: string;
  level: number;
  xp: number;
  flags: number;
  completedMissions: number;
  isCurrentUser: boolean;
}

export interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface AssessmentQuestion {
  id: number;
  category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface AssessmentResult {
  pretest: { score: number; completedAt: string } | null;
  posttest: { score: number; completedAt: string } | null;
  improvement: number | null;
}
