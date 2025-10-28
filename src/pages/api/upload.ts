import type { APIRoute } from 'astro';
import { validateSubtitleFile, parseSubtitleFile } from '../../utils/subtitle';

// Enable server-side rendering
export const prerender = false;

// Rate limiting setup
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({
          error: 'Invalid content type. Must be multipart/form-data',
        }),
        {
          status: 415,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const clientRequests = requestCounts.get(clientIP);

    if (clientRequests) {
      if (now - clientRequests.timestamp < RATE_LIMIT_WINDOW) {
        if (clientRequests.count >= MAX_REQUESTS_PER_WINDOW) {
          return new Response(
            JSON.stringify({
              error: 'Too many requests. Please try again later.',
            }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        clientRequests.count++;
      } else {
        requestCounts.set(clientIP, { count: 1, timestamp: now });
      }
    } else {
      requestCounts.set(clientIP, { count: 1, timestamp: now });
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file
    const validation = validateSubtitleFile(file);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse subtitle file
    const subtitles = await parseSubtitleFile(file);

    // Return parsed subtitles
    return new Response(
      JSON.stringify({
        success: true,
        data: subtitles,
        filename: file.name,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error processing subtitle file. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.timestamp >= RATE_LIMIT_WINDOW) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);
