import { LearningPreferences } from '@/types/learning';

export type LearningPurpose = 'overview' | 'steps' | 'project-based';

interface CourseStructure {
  title: string;
  description: string;
  learningObjectives: string[];
  videoSequence: {
    order: number;
    title: string;
    description: string;
    searchKeywords: string[];
  }[];
}

export async function generateCourseStructure(
  topic: string,
  purpose: LearningPurpose,
  intent?: string
): Promise<CourseStructure> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const purposeDescriptions = {
    overview: 'a comprehensive overview and introduction to the topic, covering key concepts, fundamentals, and the big picture',
    steps: 'a step-by-step tutorial approach, breaking down the topic into clear, sequential learning steps',
    'project-based': 'a hands-on, project-based learning approach where you build something practical while learning'
  };

  const prompt = `You are an expert educational content curator. Create a structured learning path for the topic: "${topic}"

Learning Purpose: ${purposeDescriptions[purpose]}
${intent ? `Learning Goal: ${intent}` : ''}

Generate a well-structured course outline with:
1. A compelling course title
2. A detailed course description (2-3 sentences)
3. 3-5 clear learning objectives
4. A sequence of 8-12 video topics that should be covered, ordered logically

For each video topic, provide:
- A descriptive title
- A brief description of what should be covered
- 3-5 search keywords that would help find the best YouTube videos for this topic

Format your response as JSON with this structure:
{
  "title": "Course Title",
  "description": "Course description",
  "learningObjectives": ["objective1", "objective2", ...],
  "videoSequence": [
    {
      "order": 1,
      "title": "Video Topic Title",
      "description": "What this video should cover",
      "searchKeywords": ["keyword1", "keyword2", "keyword3"]
    },
    ...
  ]
}

Make sure the sequence flows logically and builds upon previous concepts.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content curator. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate course structure');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response (handle markdown code blocks if present)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const courseStructure = JSON.parse(jsonString) as CourseStructure;

    return courseStructure;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export function getPurposeLabel(purpose: LearningPurpose): string {
  const labels = {
    overview: '📋 Overview',
    steps: '📝 Step-by-Step',
    'project-based': '🛠️ Project-Based'
  };
  return labels[purpose];
}

export function getPurposeDescription(purpose: LearningPurpose): string {
  const descriptions = {
    overview: 'Get a comprehensive introduction and understand the big picture',
    steps: 'Learn through clear, sequential tutorials and guides',
    'project-based': 'Build something practical while learning hands-on'
  };
  return descriptions[purpose];
}

