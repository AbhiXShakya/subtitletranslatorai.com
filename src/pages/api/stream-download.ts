import type { APIRoute } from 'astro';
import subsrt from 'subsrt-ts';
import { Readable } from 'stream';

export const prerender = false;

// Helper to convert subtitle object to string format
const formatSubtitle = (format: string, subtitle: any) => {
  const parser = new subsrt.SubtitleParser();
  return parser.stringifySync([subtitle], { format });
};

export const post: APIRoute = async ({ request }) => {
  const CHUNK_SIZE = 100; // Process 100 subtitles at a time

  try {
    const data = await request.json();
    const { subtitles, format, filename } = data;

    if (!Array.isArray(subtitles) || subtitles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid subtitles provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Set up response headers for streaming
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    // Create readable stream from subtitle chunks
    const stream = new Readable({
      read() {
        // Implementation handled by push() calls
      },
    });

    let currentIndex = 0;

    // Process subtitles in chunks
    const processNextChunk = () => {
      if (currentIndex >= subtitles.length) {
        stream.push(null); // End of stream
        return;
      }

      const chunk = subtitles.slice(currentIndex, currentIndex + CHUNK_SIZE);

      try {
        // Format each subtitle in the chunk
        const formattedChunk = chunk
          .map((subtitle) => formatSubtitle(format, subtitle))
          .join('\\n');

        stream.push(formattedChunk);
        currentIndex += CHUNK_SIZE;

        // Process next chunk on next tick
        setTimeout(processNextChunk, 0);
      } catch (error) {
        console.error('Error processing chunk:', error);
        stream.destroy(
          error instanceof Error ? error : new Error('Processing error')
        );
      }
    };

    // Start processing
    processNextChunk();

    return new Response(stream, { headers });
  } catch (error) {
    console.error('Stream processing error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Stream processing failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
