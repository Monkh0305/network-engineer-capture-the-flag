import { 
  User, Mission, MissionTask, Question, Hint, Achievement, 
  LeaderboardUser, CategoryProgress, AssessmentQuestion, AssessmentResult, AdminDashboardData,
  AdminUsersResponse, AdminUserDetailData, AdminMission, AdminMissionTask, AdminMissionsResponse,
  AdminMissionStatus, AdminPacketTracerLabsResponse, AdminLearningPathsResponse, AdminLearningPath,
  AdminLearningPathStage, AdminAchievement, UserLearningPath, AdminAssessment,
  AdminAssessmentQuestion, AdminAssessmentResult, AdminAssessmentMetrics, AdminAnalyticsData,
  AdminReportsData, AdminReportOptions, AdminActivityResponse
} from '../types';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
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
    return request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(username: string, email: string, password: string): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  async checkAdminAccess(): Promise<{ authorized: boolean; user: User }> {
    return request<{ authorized: boolean; user: User }>('/api/admin/access-check');
  },

  async getAdminDashboard(): Promise<AdminDashboardData> {
    return request<AdminDashboardData>('/api/admin/dashboard');
  },

  async getAdminAnalytics(): Promise<AdminAnalyticsData> {
    return request<AdminAnalyticsData>('/api/admin/analytics');
  },

  async getAdminReportOptions(): Promise<AdminReportOptions> {
    return request<AdminReportOptions>('/api/admin/options');
  },

  async getAdminReports(params: Record<string, string | number>): Promise<AdminReportsData> {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '').map(([key, value]) => [key, String(value)]));
    return request<AdminReportsData>(`/api/admin/reports?${query.toString()}`);
  },

  async getAdminActivity(params: Record<string, string | number>): Promise<AdminActivityResponse> {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '').map(([key, value]) => [key, String(value)]));
    return request<AdminActivityResponse>(`/api/admin/activity?${query.toString()}`);
  },

  async sendLearningHeartbeat(payload: {
    active: boolean;
    sessionType?: 'mission' | 'learning_path' | 'assessment' | 'packet_tracer' | 'other_learning';
    missionId?: number | null;
  }, keepalive = false): Promise<{ active: boolean; sessionId?: number; activeSeconds?: number }> {
    return request('/api/learning/heartbeat', {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive,
    });
  },

  async getAdminUsers(params: {
    page: number; pageSize: number; search: string; role: string; status: string;
    sortBy: string; sortOrder: 'asc' | 'desc';
  }): Promise<AdminUsersResponse> {
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
    return request<AdminUsersResponse>(`/api/admin/users?${query.toString()}`);
  },

  async getAdminUser(id: number): Promise<AdminUserDetailData> {
    return request<AdminUserDetailData>(`/api/admin/users/${id}`);
  },

  async setAdminUserStatus(id: number, isActive: boolean): Promise<{ user: User }> {
    return request(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
  },

  async setAdminUserRole(id: number, role: 'user' | 'admin'): Promise<{ user: User }> {
    return request(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  },

  async setAdminUserXp(id: number, xp: number): Promise<{ user: User }> {
    return request(`/api/admin/users/${id}/xp`, { method: 'PATCH', body: JSON.stringify({ xp }) });
  },

  async createPasswordReset(id: number): Promise<{ resetUrl: string; expiresAt: string }> {
    return request(`/api/admin/users/${id}/password-reset`, { method: 'POST' });
  },

  async resetAdminUserProgress(id: number): Promise<{ success: boolean; user: User }> {
    return request(`/api/admin/users/${id}/progress/reset`, { method: 'POST' });
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean }> {
    return request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
  },

  async getAdminMissions(params: Record<string, string | number>): Promise<AdminMissionsResponse> {
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
    return request(`/api/admin/missions?${query.toString()}`);
  },

  async getAdminMission(id: number): Promise<{ mission: AdminMission; tasks: AdminMissionTask[] }> {
    return request(`/api/admin/missions/${id}`);
  },

  async createAdminMission(mission: Omit<AdminMission, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>): Promise<{ mission: AdminMission }> {
    return request('/api/admin/missions', { method: 'POST', body: JSON.stringify(mission) });
  },

  async updateAdminMission(id: number, mission: Omit<AdminMission, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>): Promise<{ mission: AdminMission }> {
    return request(`/api/admin/missions/${id}`, { method: 'PUT', body: JSON.stringify(mission) });
  },

  async duplicateAdminMission(id: number): Promise<{ mission: AdminMission }> {
    return request(`/api/admin/missions/${id}/duplicate`, { method: 'POST' });
  },

  async setAdminMissionStatus(id: number, status: AdminMissionStatus): Promise<{ mission: AdminMission }> {
    return request(`/api/admin/missions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async reorderAdminMission(id: number, direction: 'up' | 'down'): Promise<{ changed: boolean }> {
    return request(`/api/admin/missions/${id}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) });
  },

  async deleteAdminMission(id: number): Promise<{ success: boolean }> {
    return request(`/api/admin/missions/${id}`, { method: 'DELETE' });
  },

  async createAdminMissionTask(missionId: number, task: Omit<AdminMissionTask, 'id' | 'missionId' | 'orderIndex'>): Promise<{ taskId: number }> {
    return request(`/api/admin/missions/${missionId}/tasks`, { method: 'POST', body: JSON.stringify(task) });
  },

  async updateAdminMissionTask(missionId: number, taskId: number, task: Pick<AdminMissionTask, 'taskType' | 'title' | 'content' | 'isEnabled'>): Promise<{ success: boolean }> {
    return request(`/api/admin/missions/${missionId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(task) });
  },

  async setAdminMissionTaskEnabled(missionId: number, taskId: number, isEnabled: boolean): Promise<{ success: boolean }> {
    return request(`/api/admin/missions/${missionId}/tasks/${taskId}/enabled`, { method: 'PATCH', body: JSON.stringify({ isEnabled }) });
  },

  async reorderAdminMissionTask(missionId: number, taskId: number, direction: 'up' | 'down'): Promise<{ changed: boolean }> {
    return request(`/api/admin/missions/${missionId}/tasks/${taskId}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) });
  },

  async deleteAdminMissionTask(missionId: number, taskId: number): Promise<{ success: boolean }> {
    return request(`/api/admin/missions/${missionId}/tasks/${taskId}`, { method: 'DELETE' });
  },

  async getAdminPacketTracerLabs(): Promise<AdminPacketTracerLabsResponse> {
    return request('/api/admin/packet-tracer');
  },

  async uploadAdminPacketTracerLab(missionId: number, file: File): Promise<{ replaced: boolean }> {
    const form = new FormData();
    form.append('missionId', String(missionId));
    form.append('file', file);
    const response = await fetch('/api/admin/packet-tracer/upload', {
      method: 'POST', body: form, credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP error ${response.status}`);
    return data;
  },

  getAdminPacketTracerDownloadUrl(missionId: number): string {
    return `/api/admin/packet-tracer/${missionId}/download`;
  },

  async removeAdminPacketTracerLab(missionId: number): Promise<{ success: boolean }> {
    return request(`/api/admin/packet-tracer/${missionId}`, { method: 'DELETE' });
  },

  async getAdminLearningPaths(): Promise<AdminLearningPathsResponse> {
    return request('/api/admin/learning-paths');
  },
  async createAdminLearningPath(payload: { name: string; slug?: string; description: string; status: 'draft' | 'published' }): Promise<{ path: AdminLearningPath }> {
    return request('/api/admin/learning-paths', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateAdminLearningPath(id: number, payload: { name: string; slug?: string; description: string; status: 'draft' | 'published' }): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async setAdminLearningPathStatus(id: number, status: 'draft' | 'published'): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  async deleteAdminLearningPath(id: number): Promise<{ success: boolean }> {
    return request(`/api/admin/learning-paths/${id}`, { method: 'DELETE' });
  },
  async createAdminLearningPathStage(pathId: number, payload: Pick<AdminLearningPathStage, 'name' | 'description' | 'icon' | 'accent'>): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${pathId}/stages`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateAdminLearningPathStage(pathId: number, stageId: number, payload: Pick<AdminLearningPathStage, 'name' | 'description' | 'icon' | 'accent'>): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async setAdminStagePrerequisite(pathId: number, stageId: number, prerequisiteStageId: number | null): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}/prerequisite`, { method: 'PATCH', body: JSON.stringify({ prerequisiteStageId }) });
  },
  async reorderAdminLearningPathStage(pathId: number, stageId: number, direction: 'up' | 'down'): Promise<{ changed: boolean }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) });
  },
  async deleteAdminLearningPathStage(pathId: number, stageId: number): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}`, { method: 'DELETE' });
  },
  async assignMissionToStage(pathId: number, stageId: number, missionId: number): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}/missions`, { method: 'POST', body: JSON.stringify({ missionId }) });
  },
  async unassignMissionFromStage(pathId: number, stageId: number, missionId: number): Promise<{ path: AdminLearningPath }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}/missions/${missionId}`, { method: 'DELETE' });
  },
  async reorderAdminStageMission(pathId: number, stageId: number, missionId: number, direction: 'up' | 'down'): Promise<{ changed: boolean }> {
    return request(`/api/admin/learning-paths/${pathId}/stages/${stageId}/missions/${missionId}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) });
  },

  async getAdminAchievements(): Promise<{ achievements: AdminAchievement[]; conditionTypes: string[] }> {
    return request('/api/admin/achievements');
  },
  async createAdminAchievement(payload: Omit<AdminAchievement, 'id' | 'slug' | 'category' | 'unlockedCount' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive: boolean }): Promise<{ achievement: AdminAchievement }> {
    return request('/api/admin/achievements', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateAdminAchievement(id: number, payload: { name: string; description: string; icon: string; conditionType: string; conditionValue: number; isActive: boolean }): Promise<{ achievement: AdminAchievement }> {
    return request(`/api/admin/achievements/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async setAdminAchievementActive(id: number, isActive: boolean): Promise<{ achievement: AdminAchievement }> {
    return request(`/api/admin/achievements/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
  },
  async deleteAdminAchievement(id: number): Promise<{ success: boolean }> {
    return request(`/api/admin/achievements/${id}`, { method: 'DELETE' });
  },

  async getAdminAssessments(): Promise<{ assessments: AdminAssessment[]; categories: string[] }> {
    return request('/api/admin/assessments');
  },
  async createAdminAssessment(payload: { title: string; description: string; assessmentType: 'pretest' | 'posttest'; isActive: boolean }): Promise<{ assessment: AdminAssessment }> {
    return request('/api/admin/assessments', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateAdminAssessment(id: number, payload: { title: string; slug?: string; description: string; assessmentType: 'pretest' | 'posttest'; isActive: boolean }): Promise<{ assessment: AdminAssessment }> {
    return request(`/api/admin/assessments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async setAdminAssessmentActive(id: number, isActive: boolean): Promise<{ assessment: AdminAssessment }> {
    return request(`/api/admin/assessments/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
  },
  async getAdminAssessmentQuestions(id: number): Promise<{ assessment: AdminAssessment; questions: AdminAssessmentQuestion[] }> {
    return request(`/api/admin/assessments/${id}/questions`);
  },
  async createAdminAssessmentQuestion(id: number, payload: Omit<AdminAssessmentQuestion, 'id' | 'orderIndex'>): Promise<{ questionId: number }> {
    return request(`/api/admin/assessments/${id}/questions`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateAdminAssessmentQuestion(id: number, questionId: number, payload: Omit<AdminAssessmentQuestion, 'id' | 'orderIndex'>): Promise<{ success: boolean; questionId: number }> {
    return request(`/api/admin/assessments/${id}/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteAdminAssessmentQuestion(id: number, questionId: number): Promise<{ success: boolean }> {
    return request(`/api/admin/assessments/${id}/questions/${questionId}`, { method: 'DELETE' });
  },
  async reorderAdminAssessmentQuestion(id: number, questionId: number, direction: 'up' | 'down'): Promise<{ changed: boolean }> {
    return request(`/api/admin/assessments/${id}/questions/${questionId}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) });
  },
  async getAdminAssessmentResults(type = 'all'): Promise<{ results: AdminAssessmentResult[] }> {
    return request(`/api/admin/assessments/results?type=${type}`);
  },
  async getAdminAssessmentMetrics(): Promise<{ metrics: AdminAssessmentMetrics }> {
    return request('/api/admin/assessments/results/aggregate');
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

  async getLearningPaths(): Promise<{ paths: UserLearningPath[] }> {
    return request('/api/learning-paths');
  },

  // Leaderboard
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardUser[] }> {
    return request<{ leaderboard: LeaderboardUser[] }>('/api/leaderboard');
  },

  // Assessment
  async getAssessmentQuestions(type: 'pretest' | 'posttest' = 'posttest'): Promise<{ assessment: { id: number; title: string; assessmentType: string; description: string } | null; questions: AssessmentQuestion[] }> {
    return request(`/api/assessment/questions?type=${type}`);
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

  getLabDownloadUrl(filename: string, missionId?: number): string {
    return missionId ? `/api/download/lab/mission/${missionId}` : `/api/download/lab/${encodeURIComponent(filename)}`;
  }
};
