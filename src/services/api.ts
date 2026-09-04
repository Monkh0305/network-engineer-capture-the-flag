import { 
  User, Mission, MissionTask, Question, Hint, Achievement, 
  LeaderboardUser, CategoryProgress, AssessmentQuestion, AssessmentResult 
} from '../types';

let currentUserId: number | null = 1;

export function setApiUserId(id: number | null) {
  currentUserId = id;
}

export function getApiUserId(): number | null {
  return currentUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (currentUserId) {
    headers.set('x-user-id', currentUserId.toString());
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setApiUserId(res.user.id);
    return res;
  },

  async register(username: string, email: string, password: string): Promise<{ user: User }> {
    const res = await request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    setApiUserId(res.user.id);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  // Missions
  async getMissions(): Promise<{ missions: Mission[] }> {
    return request<{ missions: Mission[] }>('/api/missions');
  },

  async getMission(id: number): Promise<{ mission: Mission; tasks: MissionTask[]; hints: Hint[] }> {
    return request<{ mission: Mission; tasks: MissionTask[]; hints: Hint[] }>(`/api/missions/${id}`);
  },

  async getQuestions(missionId: number): Promise<{ questions: Question[] }> {
    return request<{ questions: Question[] }>(`/api/missions/${missionId}/questions`);
  },

  async submitAnswer(missionId: number, questionId: number, selectedAnswer: string): Promise<{
    isCorrect: boolean;
    rootCause: string | null;
    explanation: string;
    selectedAnswer: string;
  }> {
    return request(`/api/missions/${missionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedAnswer })
    });
  },

  async unlockHint(missionId: number, hintId: number): Promise<{
    hintId: number;
    hintOrder: number;
    hintText: string;
    xpPenalty: number;
  }> {
    return request(`/api/missions/${missionId}/hint`, {
      method: 'POST',
      body: JSON.stringify({ hintId })
    });
  },

  async completeMission(missionId: number, submittedFlag: string): Promise<{
    success: boolean;
    message: string;
    flag: string;
    xpEarned: number;
    coinsEarned: number;
    penalty: number;
    user: User;
    nextMissionId: number | null;
  }> {
    return request(`/api/missions/${missionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ submittedFlag })
    });
  },

  // Progress & Dashboard
  async getProgress(): Promise<{
    user: User;
    stats: {
      level: number;
      totalXp: number;
      completedMissions: number;
      totalMissions: number;
      flagsCaptured: number;
      currentStreak: number;
    };
    continueMission: (Mission & { progress: number }) | null;
    categories: CategoryProgress[];
    recommendedMissions: Mission[];
  }> {
    return request('/api/progress');
  },

  // Achievements
  async getAchievements(): Promise<{ achievements: Achievement[] }> {
    return request<{ achievements: Achievement[] }>('/api/achievements');
  },

  // Leaderboard
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardUser[] }> {
    return request<{ leaderboard: LeaderboardUser[] }>('/api/leaderboard');
  },

  // Assessment
  async getAssessmentQuestions(): Promise<{ questions: AssessmentQuestion[] }> {
    return request<{ questions: AssessmentQuestion[] }>('/api/assessment/questions');
  },

  async submitPretest(answers: Record<number, string>): Promise<{
    assessmentType: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
  }> {
    return request('/api/assessment/pretest', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  async submitPosttest(answers: Record<number, string>): Promise<{
    assessmentType: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
  }> {
    return request('/api/assessment/posttest', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  async getAssessmentResults(): Promise<AssessmentResult> {
    return request<AssessmentResult>('/api/assessment/results');
  },

  getLabDownloadUrl(filename: string): string {
    return `/api/download/lab/${filename}`;
  }
};
