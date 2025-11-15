import { LearningPreferences, Video } from '@/types/learning';

/**
 * Save user progress (completed videos)
 */
export async function saveUserProgress(videoId: string, learningPathId?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, learningPathId }),
    });

    return response.ok;
  } catch (err) {
    console.error('Error in saveUserProgress:', err);
    return false;
  }
}

/**
 * Remove user progress (unmark as completed)
 */
export async function removeUserProgress(videoId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/progress', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId }),
    });

    return response.ok;
  } catch (err) {
    console.error('Error in removeUserProgress:', err);
    return false;
  }
}

/**
 * Get all completed videos for current user
 */
export async function getCompletedVideos(): Promise<Set<string>> {
  try {
    const response = await fetch('/api/progress');
    if (!response.ok) {
      return new Set();
    }

    const data = await response.json();
    return new Set(data.videoIds || []);
  } catch (err) {
    console.error('Error in getCompletedVideos:', err);
    return new Set();
  }
}

/**
 * Save learning preferences
 */
export async function saveLearningPreferences(preferences: LearningPreferences): Promise<string | null> {
  try {
    const response = await fetch('/api/learning/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.id || null;
  } catch (err) {
    console.error('Error in saveLearningPreferences:', err);
    return null;
  }
}

/**
 * Save learning path
 */
export async function saveLearningPath(
  topic: string,
  learningPurpose: string,
  videoIds: string[]
): Promise<string | null> {
  try {
    const response = await fetch('/api/learning-paths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, learningPurpose, videoIds }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.id || null;
  } catch (err) {
    console.error('Error in saveLearningPath:', err);
    return null;
  }
}

/**
 * Cache video metadata to reduce YouTube API calls
 */
export async function cacheVideoMetadata(video: Video): Promise<boolean> {
  try {
    const response = await fetch('/api/videos/cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
    });

    return response.ok;
  } catch (err) {
    console.error('Error in cacheVideoMetadata:', err);
    return false;
  }
}

