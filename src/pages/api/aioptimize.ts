import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import type {
  SubtitleItem,
  GeminiOptimizeRequest,
  GeminiOptimizeResponse,
} from '../../types/gemini';

// Reduced batch size for Cloudflare timeout limits
// Process smaller batches to stay well under timeout
const MAX_SUBTITLES_PER_REQUEST = 50; // Max 50 subtitles per API request

// Optimize subtitles (single batch, client handles batching)
async function optimizeSubtitles(
  ai: GoogleGenAI,
  subtitles: SubtitleItem[]
): Promise<SubtitleItem[]> {
  // Build context from all subtitles for better optimization
  const contextSummary =
    subtitles.length > 10
      ? `Processing ${subtitles.length} subtitles from index ${
          subtitles[0].index
        } to ${subtitles[subtitles.length - 1].index}.`
      : '';

  const prompt = `You are a professional subtitle editor with expertise in multiple languages.

TASK: Optimize the provided subtitles by following these steps:

STEP 1 - CONTEXT ANALYSIS:
First, analyze ALL the provided subtitles to understand:
- The language being used
- The overall context and topic
- The tone and style
- The narrative flow
- Any recurring themes or technical terms

${contextSummary}

STEP 2 - OPTIMIZATION:
Using the context you've built, optimize each subtitle by:
1. Fixing grammar and spelling errors
2. Improving sentence structure and clarity
3. Maintaining the original meaning and intent
4. Ensuring natural flow between subtitles, you can rephrase for better coherence
5. Respecting cultural and linguistic nuances

IMPORTANT RULES:
- Keep the SAME LANGUAGE as the input (do not translate)
- Preserve the original meaning completely
- Maintain natural flow between subtitles
- Keep subtitle length appropriate for timing
- Use context to ensure consistency across all subtitles
- Respect cultural and linguistic nuances

OUTPUT FORMAT:
Return ONLY a valid JSON array with this EXACT format, no additional text or explanation:
[
  {"index": 1, "content": "optimized subtitle text"},
  {"index": 2, "content": "optimized subtitle text"}
]

Subtitles to optimize:
${JSON.stringify(subtitles, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.text?.trim() || '';

    // Try to extract JSON from the response
    let jsonText = text;

    // Remove markdown code blocks if present
    if (text.startsWith('```')) {
      const match = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }

    // Parse the JSON response
    const optimized = JSON.parse(jsonText);

    // Validate response format
    if (!Array.isArray(optimized)) {
      throw new Error('Response is not an array');
    }

    // Validate each item has index and content
    for (const item of optimized) {
      if (typeof item.index !== 'number' || typeof item.content !== 'string') {
        throw new Error('Invalid item format in response');
      }
    }

    return optimized;
  } catch (error) {
    console.error('Error optimizing subtitles:', error);
    throw new Error(
      `Failed to optimize subtitles: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body: GeminiOptimizeRequest = await request.json();
    const { apiKey, subtitles } = body;

    // Validate request
    if (!apiKey || typeof apiKey !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key is required',
        } as GeminiOptimizeResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Subtitles array is required and must not be empty',
        } as GeminiOptimizeResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check batch size limit (client-side should handle this, but validate server-side)
    if (subtitles.length > MAX_SUBTITLES_PER_REQUEST) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many subtitles in single request. Maximum ${MAX_SUBTITLES_PER_REQUEST} subtitles per request.`,
        } as GeminiOptimizeResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Filter out empty subtitles
    const validSubtitles = subtitles.filter(
      (sub) => sub.content && sub.content.trim().length > 0
    );

    if (validSubtitles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid subtitles to optimize',
        } as GeminiOptimizeResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey });

    console.log(`Processing ${validSubtitles.length} subtitles`);

    // Process the batch
    try {
      const optimized = await optimizeSubtitles(ai, validSubtitles);

      // Sort by index to maintain order
      optimized.sort((a, b) => a.index - b.index);

      return new Response(
        JSON.stringify({
          success: true,
          optimized: optimized,
        } as GeminiOptimizeResponse),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error optimizing subtitles:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to optimize subtitles',
        } as GeminiOptimizeResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in AI optimize endpoint:', error);

    // Check for specific API key errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isApiKeyError =
      errorMessage.toLowerCase().includes('api key') ||
      errorMessage.toLowerCase().includes('authentication');

    return new Response(
      JSON.stringify({
        success: false,
        error: isApiKeyError
          ? 'Invalid API key. Please check your Gemini API key and try again.'
          : `Failed to optimize subtitles: ${errorMessage}`,
      } as GeminiOptimizeResponse),
      {
        status: isApiKeyError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
