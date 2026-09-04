export interface User {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  created_at: string;
}

export type MissionDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MissionCategory = 'Fundamental' | 'IP Addressing' | 'Subnetting' | 'Switching' | 'VLAN' | 'Default Gateway' | 'Routing' | 'Troubleshooting' | 'Security';
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
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  xp_reward: number;
  category: MissionCategory;
  stage: number;
  stage_name: string;
  estimated_time: string;
  packet_tracer_file: string;
  order_index: number;
  incident_id: string;
  department: string;
  reported_time: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scenario_text: string;
  target_flag: string;
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
  pretest: { score: number; completedAt: string };
  posttest: { score: number; completedAt: string } | null;
  improvement: number | null;
}
