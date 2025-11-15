import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { LearningPreferences, Video } from '@/types/learning';
import { generateCourseStructure } from '@/lib/services/openai';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      high: { url: string };
    };
    publishedAt: string;
    description: string;
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1] || '0') || 0;
  const minutes = parseInt(match?.[2] || '0') || 0;
  const seconds = parseInt(match?.[3] || '0') || 0;
  return hours * 60 + minutes + seconds / 60;
}

function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = match?.[1] ? parseInt(match[1]) : 0;
  const minutes = match?.[2] ? parseInt(match[2]) : 0;
  const seconds = match?.[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
  return `${num} views`;
}

function scoreVideo(
  video: YouTubeVideo,
  details: YouTubeVideoDetails,
  preferences: LearningPreferences,
  videoTopic: string,
  totalCourseDuration?: number
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];
  
  const durationMinutes = parseDuration(details.contentDetails.duration);
  const views = parseInt(details.statistics.viewCount);
  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();
  const topic = preferences.topic.toLowerCase();
  const videoTopicLower = videoTopic.toLowerCase();
  
  // Course duration match (considering total course duration)
  // Convert course duration preference to minutes
  const courseDurationMap: Record<string, { min: number; max: number }> = {
    '1-2': { min: 60, max: 120 },
    '2-5': { min: 120, max: 300 },
    '5-10': { min: 300, max: 600 },
    '10+': { min: 600, max: Infinity }
  };
  
  const courseDurationRange = courseDurationMap[preferences.duration];
  
  // If we have total course duration, check if adding this video keeps us in range
  if (totalCourseDuration !== undefined) {
    const newTotal = totalCourseDuration + durationMinutes;
    if (newTotal >= courseDurationRange.min && newTotal <= courseDurationRange.max) {
      score += 20;
      reasons.push(`Contributes well to your ${preferences.duration} hour course goal`);
    } else if (newTotal < courseDurationRange.max * 1.2) {
      // Allow some flexibility (20% over)
      score += 10;
    }
  } else {
    // Individual video scoring - prefer videos that are good building blocks
    // For course duration, we want videos that are substantial but not too long
    if (durationMinutes >= 10 && durationMinutes <= 60) {
      score += 12;
      reasons.push(`Good length (${Math.round(durationMinutes)} min) for course content`);
    } else if (durationMinutes > 60 && durationMinutes <= 120) {
    score += 8;
      reasons.push(`Longer video (${Math.round(durationMinutes)} min) - comprehensive content`);
    }
  }
  
  // Purpose-based keywords
  const purposeKeywords = {
    overview: ['introduction', 'overview', 'basics', 'fundamentals', 'what is', 'explained', 'guide', 'tutorial'],
    steps: ['step by step', 'tutorial', 'how to', 'guide', 'walkthrough', 'learn', 'complete course'],
    'project-based': ['project', 'build', 'create', 'hands-on', 'practical', 'tutorial', 'full project', 'real world']
  };
  
  const purposeWords = purposeKeywords[preferences.learningPurpose];
  const hasPurposeMatch = purposeWords.some(word => title.includes(word) || description.includes(word));
  if (hasPurposeMatch) {
    score += 12;
    reasons.push(`Matches ${preferences.learningPurpose} learning approach`);
  }
  
  // Video topic relevance (from AI-generated structure)
  if (videoTopicLower && (title.includes(videoTopicLower) || description.includes(videoTopicLower))) {
    score += 15;
    reasons.push(`Highly relevant to course structure: ${videoTopic}`);
  }
  
  // Topic relevance
  const topicWords = topic.split(' ');
  const topicMatches = topicWords.filter(word => 
    title.includes(word) || description.includes(word)
  ).length;
  
  if (topicMatches === topicWords.length) {
    score += 10;
    reasons.push(`Highly relevant to "${preferences.topic}"`);
  } else if (topicMatches > 0) {
    score += 5;
  }
  
  // View count credibility
  if (views > 100000) {
    score += 10;
    reasons.push('Highly popular and well-received by learners');
  } else if (views > 10000) {
    score += 5;
    reasons.push('Good engagement from the learning community');
  }
  
  // Educational channel indicators
  const eduChannels = ['traversy', 'academind', 'net ninja', 'fireship', 'programming with mosh', 'freecodecamp'];
  if (eduChannels.some(ch => video.snippet.channelTitle.toLowerCase().includes(ch))) {
    score += 10;
    reasons.push('From a trusted educational content creator');
  }
  
  // Recency bonus (content within last 2 years)
  const publishDate = new Date(video.snippet.publishedAt);
  const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld <= 24) {
    score += 8;
    reasons.push('Recent content with up-to-date information');
  }
  
  // Quality indicators in title/description
  const qualityWords = ['complete', 'full', 'comprehensive', 'step by step', 'project', 'hands-on'];
  if (qualityWords.some(word => title.includes(word) || description.includes(word))) {
    score += 8;
    reasons.push('Comprehensive and structured learning approach');
  }
  
  return { score: Math.min(score, 100), reasons: reasons.slice(0, 4) };
}

async function searchVideosForTopic(
  searchQuery: string,
  language: string,
  maxResults: number = 5
): Promise<YouTubeVideo[]> {
  try {
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${maxResults}&relevanceLanguage=${language}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `YouTube API error: ${searchResponse.status} ${searchResponse.statusText}`;
      
      // Log detailed error for debugging
      console.error('YouTube API search error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorData.error,
        query: searchQuery
      });
      
      // Handle specific error cases
      if (searchResponse.status === 403) {
        const reason = errorData.error?.errors?.[0]?.reason || errorData.error?.message || 'unknown';
        if (reason.includes('quota') || reason.includes('quotaExceeded')) {
          throw new Error('YouTube API quota exceeded. Please check your API quota or try again later.');
        } else if (reason.includes('keyInvalid') || reason.includes('keyExpired')) {
          throw new Error('YouTube API key is invalid or expired. Please check your API key configuration.');
        } else {
          throw new Error('YouTube API access denied. Please check your API key and permissions.');
        }
      } else if (searchResponse.status === 429) {
        throw new Error('YouTube API rate limit exceeded. Please try again later.');
      } else if (searchResponse.status === 503) {
        // 503 can mean service unavailable or quota exceeded
        const reason = errorData.error?.errors?.[0]?.reason || errorData.error?.message || 'unknown';
        if (reason.includes('quota') || reason.includes('backendError')) {
          throw new Error('YouTube API quota exceeded or service temporarily unavailable. Please try again later.');
        } else {
          throw new Error('YouTube API service is temporarily unavailable. Please try again in a few moments.');
        }
      } else {
        throw new Error(errorMessage);
      }
    }
    
    const searchData = await searchResponse.json();
    
    // Check for API errors in response
    if (searchData.error) {
      console.error('YouTube API response error:', searchData.error);
      throw new Error(searchData.error.message || 'YouTube API returned an error');
    }
    
    return searchData.items || [];
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch videos from YouTube');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[YouTube Search] Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!YOUTUBE_API_KEY) {
      console.error('[YouTube Search] YouTube API key not configured');
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    const preferences: LearningPreferences = await request.json();
    console.log('[YouTube Search] Received preferences:', {
      topic: preferences.topic,
      learningPurpose: preferences.learningPurpose,
      duration: preferences.duration,
      language: preferences.language,
      intent: preferences.intent
    });
    
    // Generate course structure using OpenAI
    let courseStructure;
    try {
      console.log('[YouTube Search] Generating course structure with OpenAI...');
      courseStructure = await generateCourseStructure(
        preferences.topic,
        preferences.learningPurpose,
        preferences.intent
      );
      console.log('[YouTube Search] Course structure generated:', {
        title: courseStructure.title,
        videoCount: courseStructure.videoSequence.length
      });
    } catch (error) {
      console.error('[YouTube Search] OpenAI error, falling back to simple search:', error);
      // Fallback to simple search if OpenAI fails
      const searchQuery = `${preferences.topic} ${preferences.learningPurpose} ${preferences.intent || ''}`.trim();
      console.log('[YouTube Search] Fallback search query:', searchQuery);
      const videos = await searchVideosForTopic(searchQuery, preferences.language, 20);
      console.log('[YouTube Search] Fallback search found', videos.length, 'videos');
      const videoIds = videos.map((item: YouTubeVideo) => item.id.videoId).join(',');
      
      if (!videoIds || videos.length === 0) {
        console.error('[YouTube Search] No videos found in fallback search');
        return NextResponse.json(
          { 
            videos: [],
            error: 'No videos found. Please check your search terms or try a different topic.'
          },
          { status: 404 }
        );
      }
      
      const detailsResponse = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
      if (!detailsResponse.ok) {
      return NextResponse.json(
          { error: 'Failed to fetch video details' },
          { status: detailsResponse.status }
        );
      }
      
      const detailsData = await detailsResponse.json();
      const detailsMap = new Map<string, YouTubeVideoDetails>(
        detailsData.items.map((item: YouTubeVideoDetails) => [item.id, item])
      );
      
      // Score videos and track course duration
      const courseDurationMap: Record<string, { min: number; max: number }> = {
        '1-2': { min: 60, max: 120 },
        '2-5': { min: 120, max: 300 },
        '5-10': { min: 300, max: 600 },
        '10+': { min: 600, max: Infinity }
      };
      const courseDurationRange = courseDurationMap[preferences.duration];
      
      const scoredVideos = videos
        .map((item: YouTubeVideo) => {
          const details = detailsMap.get(item.id.videoId);
          if (!details) return null;
          
          const { score, reasons } = scoreVideo(item, details, preferences, preferences.topic);
          const videoDuration = parseDuration(details.contentDetails.duration);
          
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails.high.url,
            duration: formatDuration(details.contentDetails.duration),
            viewCount: formatViewCount(details.statistics.viewCount),
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            learningScore: score,
            reasons,
            videoDurationMinutes: videoDuration
          } as Video & { videoDurationMinutes: number };
        })
        .filter((v): v is Video & { videoDurationMinutes: number } => v !== null)
        .sort((a, b) => b.learningScore - a.learningScore);
      
      // Select videos that fit within course duration
      const selectedVideos: Video[] = [];
      let currentTotal = 0;
      const maxDuration = courseDurationRange.max === Infinity ? Infinity : courseDurationRange.max * 1.2;
      
      for (const video of scoredVideos) {
        const newTotal = currentTotal + video.videoDurationMinutes;
        
        if (newTotal <= maxDuration) {
          const { videoDurationMinutes, ...videoData } = video;
          selectedVideos.push(videoData);
          currentTotal = newTotal;
        }
        
        if (courseDurationRange.max !== Infinity && currentTotal >= courseDurationRange.min && currentTotal >= courseDurationRange.max * 0.8) {
          break;
        }
        
        // For 10+ hours, select at least 12 videos
        if (courseDurationRange.max === Infinity && selectedVideos.length >= 12 && currentTotal >= 600) {
          break;
        }
      }
      
      // Ensure we have at least minimum duration
      if (courseDurationRange.max !== Infinity && currentTotal < courseDurationRange.min) {
        for (const video of scoredVideos) {
          if (selectedVideos.find(v => v.id === video.id)) continue;
          
          const { videoDurationMinutes, ...videoData } = video;
          selectedVideos.push(videoData);
          currentTotal += video.videoDurationMinutes;
          
          if (currentTotal >= courseDurationRange.min) break;
        }
      }
      
      // Ensure we have at least some videos (minimum 3, or all available if less)
      if (selectedVideos.length === 0 && scoredVideos.length > 0) {
        const minVideos = Math.min(3, scoredVideos.length);
        for (let i = 0; i < minVideos; i++) {
          const { videoDurationMinutes, ...videoData } = scoredVideos[i];
          selectedVideos.push(videoData);
        }
      }
      
      return NextResponse.json({ videos: selectedVideos.slice(0, 12) });
    }
    
    // Search for videos for each topic in the course structure
    const allVideos: Array<{ video: YouTubeVideo; topic: string; order: number }> = [];
    
    for (const videoTopic of courseStructure.videoSequence) {
      // Build search query from keywords
      const searchQuery = `${preferences.topic} ${videoTopic.searchKeywords.join(' ')} ${preferences.learningPurpose}`.trim();
      
      try {
        console.log(`[YouTube Search] Searching for topic "${videoTopic.title}" with query:`, searchQuery);
        const videos = await searchVideosForTopic(searchQuery, preferences.language, 3);
        console.log(`[YouTube Search] Found ${videos.length} videos for topic "${videoTopic.title}"`);
        videos.forEach(video => {
          allVideos.push({ video, topic: videoTopic.title, order: videoTopic.order });
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[YouTube Search] Error searching for topic "${videoTopic.title}":`, errorMessage);
        // Continue to next topic instead of failing completely
      }
    }
    
    if (allVideos.length === 0) {
      console.error('[YouTube Search] No videos found for any topic in course structure');
      // Fall back to simple search if AI-generated structure fails
      console.log('[YouTube Search] Falling back to simple search...');
      const fallbackQuery = `${preferences.topic} ${preferences.learningPurpose} tutorial`;
      try {
        const fallbackVideos = await searchVideosForTopic(fallbackQuery, preferences.language, 20);
        if (fallbackVideos.length > 0) {
          const videoIds = fallbackVideos.map((item: YouTubeVideo) => item.id.videoId).join(',');
          const detailsResponse = await fetch(
            `${YOUTUBE_API_BASE}/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
          );
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const detailsMap = new Map<string, YouTubeVideoDetails>(
              detailsData.items.map((item: YouTubeVideoDetails) => [item.id, item])
            );
            
            const scoredVideos = fallbackVideos
              .map((item: YouTubeVideo) => {
                const details = detailsMap.get(item.id.videoId);
                if (!details) return null;
                
                const { score, reasons } = scoreVideo(item, details, preferences, preferences.topic);
                const videoDuration = parseDuration(details.contentDetails.duration);
                
                return {
                  id: item.id.videoId,
                  title: item.snippet.title,
                  channelName: item.snippet.channelTitle,
                  thumbnailUrl: item.snippet.thumbnails.high.url,
                  duration: formatDuration(details.contentDetails.duration),
                  viewCount: formatViewCount(details.statistics.viewCount),
                  publishedAt: item.snippet.publishedAt,
                  description: item.snippet.description,
                  url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                  learningScore: score,
                  reasons,
                  videoDurationMinutes: videoDuration
                } as Video & { videoDurationMinutes: number };
              })
              .filter((v): v is Video & { videoDurationMinutes: number } => v !== null)
              .sort((a, b) => b.learningScore - a.learningScore);
            
            // Select videos that fit within course duration
            const courseDurationMap: Record<string, { min: number; max: number }> = {
              '1-2': { min: 60, max: 120 },
              '2-5': { min: 120, max: 300 },
              '5-10': { min: 300, max: 600 },
              '10+': { min: 600, max: Infinity }
            };
            const courseDurationRange = courseDurationMap[preferences.duration];
            const selectedVideos: Video[] = [];
            let currentTotal = 0;
            const maxDuration = courseDurationRange.max === Infinity ? Infinity : courseDurationRange.max * 1.2;
            
            for (const video of scoredVideos) {
              const newTotal = currentTotal + video.videoDurationMinutes;
              if (newTotal <= maxDuration) {
                const { videoDurationMinutes, ...videoData } = video;
                selectedVideos.push(videoData);
                currentTotal = newTotal;
              }
              if (courseDurationRange.max !== Infinity && currentTotal >= courseDurationRange.min && currentTotal >= courseDurationRange.max * 0.8) {
                break;
              }
            }
            
            return NextResponse.json({ videos: selectedVideos.slice(0, 12) });
          }
        }
      } catch (fallbackError) {
        const errorMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        console.error('[YouTube Search] Fallback search also failed:', errorMsg);
        
        // If it's a YouTube API error, return that specific error
        if (errorMsg.includes('quota') || errorMsg.includes('API key')) {
          return NextResponse.json(
            { 
              videos: [],
              error: errorMsg
            },
            { status: 503 }
          );
        }
      }
      
      console.error('[YouTube Search] All search attempts failed - no videos found');
      return NextResponse.json(
        { 
          videos: [],
          error: 'No videos found. This may be due to YouTube API quota limits or invalid API key. Please check your API configuration.'
        },
        { status: 503 }
      );
    }
    
    console.log(`Found ${allVideos.length} videos across ${courseStructure.videoSequence.length} topics`);
    
    // Get video details
    const videoIds = allVideos.map(item => item.video.id.videoId).join(',');
    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!detailsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch video details' },
        { status: detailsResponse.status }
      );
    }
    
    const detailsData = await detailsResponse.json();
    const detailsMap = new Map<string, YouTubeVideoDetails>(
      detailsData.items.map((item: YouTubeVideoDetails) => [item.id, item])
    );
    
    // Score and transform videos, maintaining order
    const courseDurationMap: Record<string, { min: number; max: number }> = {
      '1-2': { min: 60, max: 120 },
      '2-5': { min: 120, max: 300 },
      '5-10': { min: 300, max: 600 },
      '10+': { min: 600, max: Infinity }
    };
    const courseDurationRange = courseDurationMap[preferences.duration];
    
    const scoredVideos = allVideos
      .map(({ video, topic, order }) => {
        const details = detailsMap.get(video.id.videoId);
        if (!details) return null;
        
        // Get video duration
        const videoDuration = parseDuration(details.contentDetails.duration);
        
        // Score video (without total duration for initial scoring)
        const { score, reasons } = scoreVideo(video, details, preferences, topic);
        
        const scoredVideo = {
          id: video.id.videoId,
          title: video.snippet.title,
          channelName: video.snippet.channelTitle,
          thumbnailUrl: video.snippet.thumbnails.high.url,
          duration: formatDuration(details.contentDetails.duration),
          viewCount: formatViewCount(details.statistics.viewCount),
          publishedAt: video.snippet.publishedAt,
          description: video.snippet.description,
          url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          learningScore: score,
          reasons,
          courseOrder: order,
          courseTopic: topic,
          videoDurationMinutes: videoDuration
        } as Video & { courseOrder: number; courseTopic: string; videoDurationMinutes: number };
        
        return scoredVideo;
      })
      .filter((v): v is Video & { courseOrder: number; courseTopic: string; videoDurationMinutes: number } => v !== null)
      .sort((a, b) => {
        // First sort by course order, then by score
        if (a.courseOrder !== b.courseOrder) {
          return a.courseOrder - b.courseOrder;
        }
        return b.learningScore - a.learningScore;
      });
    
    // Select videos that fit within the course duration preference
    const selectedVideos: Array<Video & { courseOrder: number; courseTopic: string }> = [];
    let currentTotal = 0;
    const maxDuration = courseDurationRange.max === Infinity ? Infinity : courseDurationRange.max * 1.2;
    
    // First pass: select videos that fit within duration
    for (const video of scoredVideos) {
      const newTotal = currentTotal + video.videoDurationMinutes;
      
      // If adding this video keeps us within range (with flexibility), include it
      if (newTotal <= maxDuration) {
        selectedVideos.push({
          id: video.id,
          title: video.title,
          channelName: video.channelName,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          publishedAt: video.publishedAt,
          description: video.description,
          url: video.url,
          learningScore: video.learningScore,
          reasons: video.reasons,
          courseOrder: video.courseOrder,
          courseTopic: video.courseTopic
        });
        currentTotal = newTotal;
      }
      
      // Stop if we've reached a good total (at least min, close to max)
      if (courseDurationRange.max !== Infinity && currentTotal >= courseDurationRange.min && currentTotal >= courseDurationRange.max * 0.8) {
        break;
      }
      
      // For 10+ hours, select at least 12 videos or until we have a substantial course
      if (courseDurationRange.max === Infinity && selectedVideos.length >= 12 && currentTotal >= 600) {
        break;
      }
    }
    
    // If we don't have enough videos, add more until we reach minimum
    if (courseDurationRange.max !== Infinity && currentTotal < courseDurationRange.min) {
      for (const video of scoredVideos) {
        if (selectedVideos.find(v => v.id === video.id)) continue;
        
        const newTotal = currentTotal + video.videoDurationMinutes;
        selectedVideos.push({
          id: video.id,
          title: video.title,
          channelName: video.channelName,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          publishedAt: video.publishedAt,
          description: video.description,
          url: video.url,
          learningScore: video.learningScore,
          reasons: video.reasons,
          courseOrder: video.courseOrder,
          courseTopic: video.courseTopic
        });
        currentTotal = newTotal;
        
        if (currentTotal >= courseDurationRange.min) break;
      }
    }
    
    // Ensure we have at least some videos (minimum 3, or all available if less)
    if (selectedVideos.length === 0 && scoredVideos.length > 0) {
      const minVideos = Math.min(3, scoredVideos.length);
      for (let i = 0; i < minVideos; i++) {
        const video = scoredVideos[i];
        selectedVideos.push({
          id: video.id,
          title: video.title,
          channelName: video.channelName,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          publishedAt: video.publishedAt,
          description: video.description,
          url: video.url,
          learningScore: video.learningScore,
          reasons: video.reasons,
          courseOrder: video.courseOrder,
          courseTopic: video.courseTopic
        });
      }
    }
    
    // Remove courseOrder and courseTopic before returning
    let finalVideos = selectedVideos
      .sort((a, b) => a.courseOrder - b.courseOrder)
      .map(({ courseOrder, courseTopic, ...video }) => video)
      .slice(0, 12);
    
    console.log('[YouTube Search] Selected', selectedVideos.length, 'videos, final count:', finalVideos.length);
    
    // If we still have no videos after all filtering, return the top scored videos regardless of duration
    if (finalVideos.length === 0 && scoredVideos.length > 0) {
      console.warn('[YouTube Search] No videos selected after duration filtering, returning top scored videos');
      const topVideos = scoredVideos
        .sort((a, b) => {
          if (a.courseOrder !== b.courseOrder) {
            return a.courseOrder - b.courseOrder;
          }
          return b.learningScore - a.learningScore;
        })
        .slice(0, 12)
        .map(({ courseOrder, courseTopic, videoDurationMinutes, ...video }) => video);
      finalVideos = topVideos;
      console.log('[YouTube Search] Returning', finalVideos.length, 'top scored videos');
    }
    
    console.log('[YouTube Search] Returning', finalVideos.length, 'videos to client');
    return NextResponse.json({ 
      videos: finalVideos,
      courseStructure: {
        title: courseStructure.title,
        description: courseStructure.description,
        learningObjectives: courseStructure.learningObjectives
      }
    });
  } catch (error) {
    console.error('[YouTube Search] Error in YouTube search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
