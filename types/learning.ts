export type LearningPurpose = 'overview' | 'steps' | 'project-based';

export interface LearningPreferences {
  topic: string;
  learningPurpose: LearningPurpose;
  duration: '1-2' | '2-5' | '5-10' | '10+';
  language: string;
  intent?: string;
}

export interface Video {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  description: string;
  url: string;
  learningScore: number;
  reasons: string[];
  completed?: boolean;
}

export interface LearningPath {
  bestVideo: Video;
  pathVideos: Video[];
  estimatedTotalTime: string;
  pathDescription: string;
}

export interface UserProgress {
  completedVideos: string[];
  currentStreak: number;
  totalLearningTime: number;
  lastActivity: string;
}

