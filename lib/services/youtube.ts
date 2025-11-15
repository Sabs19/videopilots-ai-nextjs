import { LearningPreferences, Video } from '@/types/learning';

export async function searchYouTubeVideos(preferences: LearningPreferences): Promise<Video[]> {
  try {
    console.log('[YouTube Service] Sending request to /api/youtube/search with:', preferences);
    const response = await fetch('/api/youtube/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    console.log('[YouTube Service] Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = 'Failed to search YouTube videos';
      try {
        const error = await response.json();
        console.error('[YouTube Service] Error response:', error);
        errorMessage = error.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[YouTube Service] Response data:', { 
      hasVideos: !!data.videos, 
      videoCount: data.videos?.length || 0,
      hasError: !!data.error 
    });
    
    // Check for error in response
    if (data.error) {
      console.error('[YouTube Service] Error in response:', data.error);
      throw new Error(data.error);
    }
    
    // Ensure we have videos array
    if (!data.videos || !Array.isArray(data.videos)) {
      console.error('[YouTube Service] Invalid response format:', data);
      throw new Error('Invalid response format: videos array not found');
    }
    
    // Check if videos array is empty
    if (data.videos.length === 0) {
      throw new Error('No videos found. This may be due to YouTube API quota limits or invalid API key. Please check your API configuration.');
    }
    
    return data.videos;
  } catch (error) {
    console.error('[YouTube Service] YouTube search error:', error);
    throw error;
  }
}

